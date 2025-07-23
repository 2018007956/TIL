async function get_kyobobook_info(tp, url = "", title_section = true, cover_section = true, toc_section = true) {
let tR = "";

/*
@2023-04-10 20:00:00
노트의 frontmatter에 추가 (Add to the Frontmatter of the notes you want)
url: 교보문고 도서 url
*/

if(url == "") {
  url = tp.frontmatter["url"];
}

if(!url) {
  let modal = new tp.obsidian.Modal(app);
  modal.titleEl.setText("⚠ 에러 - frontmatter에 url을 넣으세요.");
  modal.contentEl.setText("url:" + url);
  modal.open();
  
  return; // 아무 것도 하지 않고 마치기
}
console.log("url:", url);

let response;
try {
  response = await request({"url":url});
} catch(e) {
  console.log("에러 발생 - request");
  console.log(e);
  alert("에러 발생 - request\n\n" + e +"\n\n옵시디언을 다시 시작해 보세요.");
  return;
}
// console.log("response:", response);

const parser = new DOMParser();
const doc = parser.parseFromString(response, "text/html");
// console.log("doc:", doc);

let cover;
let category;
let publisher;
let publish_date;
let book_pages;
let isbn;
let toc;

/* 제목 */
let title = doc.body.querySelector("#contents h1 span.prod_title").innerText;
console.log("title:", title);

/* 작가들 */
// let authors = Array.from(doc.body.querySelectorAll("#contents .author a")).map( el => el.innerText );
const authors_element = doc.querySelector('#contents .author');

const authors = {}; // 결과를 저장할 객체

let names_temp = []; // 이름을 임시로 저장하는 배열
for (let i = 0; i < authors_element.childNodes.length; i++) { // 자식 노드들을 순회하며 탐색
  const node = authors_element.childNodes[i];
  if (node.nodeName === 'A') { // a 요소일 경우, 이름을 가져와서 임시 배열에 더해줌
  names_temp.push(node.textContent.trim());
  }
  else if(node.nodeName === '#text') { // 일반 텍스트일 경우
  const category = node.textContent.trim();
  if(category == "" || category == ",") {
    continue;
  }
  
  let ctitle = "";
  if (['저자'].some(v => category.includes(v))) { // 여기에 저자 항목을 더할 수 있음. 예, ['저자','글쓴이','작가']
    ctitle = "authors";
  }
  else if (['번역','옮김'].some(v => category.includes(v))) {
    ctitle = "translaters"; 
    // ctitle = "! IGNORE !"; // 이것을 주석 해제하면 이 항목을 사용하지 않음.
  }
  else if (['감수'].some(v => category.includes(v))) {
    ctitle = "editors"; 
    // ctitle = "! IGNORE !"; // 이것을 주석 해제하면 이 항목을 사용하지 않음.
  }
  else {
    ctitle = "others"; 
    // ctitle = "! IGNORE !"; // 이것을 주석 해제하면 이 항목을 사용하지 않음.
  }
  
  if(ctitle) {
    if(ctitle != "! IGNORE !") {
      if(!authors[ctitle]) authors[ctitle] = [];
      authors[ctitle].push(...names_temp);
    }
    names_temp = [];
  }
  }
}
console.log(authors);

let author = authors.authors[0]; // 파일 이름 만들 때 제일 먼저 나온 저자만 사용.
// let author = authors.authors.join(", "); // 파일 이름 만들 때 저자들을 ", "로 구분하여 사용.

/* 표지 */
let cover_element = doc.head.querySelector("meta[property='og:image']");
cover = cover_element? cover_element.content: "";

/* 카테고리 */
let category_elements = doc.body.querySelectorAll("ol.breadcrumb_list li.breadcrumb_item");
category = category_elements? category_elements[2].innerText.trim(): "";

/* 출판사 */
let publisher_element = doc.body.querySelector(".prod_info_text.publish_date a");
publisher = publisher_element? publisher_element.innerText.trim(): "";

/* 기본정보에서 */
let trs = Array.from(doc.body.querySelectorAll(".product_detail_area.basic_info tr"));
for(var i = 0; i < trs.length; i++) {
  switch(trs[i].firstElementChild.innerText.trim()) {
    case "발행(출시)일자":
      publish_date = trs[i].children[1].innerText.replace(/\s{2,}/g," ").trim();
      break;
    case "쪽수":
      book_pages = trs[i].children[1].innerText.trim();
      break;
    case "ISBN":
      isbn = trs[i].children[1].innerText.trim();
      break;
  }
}

/* 목차 - toc */
let toc_element = doc.body.querySelector(".book_contents_list li");
toc = toc_element? toc_element.innerHTML.trim().replace(/<br>/g, "  \n"): "";
// console.log(toc_element);
// console.log(toc);

/* 파일 이름 바꾸기 - 바꾸지 않으려면 주석 처리하면 됩니다. */
async function get_filename_new (folder, fname) {
  let file_exist = await tp.file.exists(folder + "/" + fname +".md");
  if(file_exist) {
    let match = fname.match(/ \((\d+)\)$/); // 파일 이름 끝이 " (3)" 이렇게 끝나면 괄호 안 숫자를 높이면서 새로운 파일 이름을 만든다.
    if(match) {
      fname = fname.replace(/ \(\d+\)$/, "") + ` (${parseInt(match[1]) + 1})`;
    }
    else {
      fname = fname + " (1)";
    }
    fname = await get_filename_new (folder, fname);
  }
  return fname;
}
let filename_old = tp.file.title; // tp.file.folder(true)+"/"+tp.file.title+".md"
let filename_new = `(Book) ${title} - ${author}`;
filename_new = filename_new.replace(/[\\/:\*\?"<>\|]/g, ""); // 파일 이름에 쓸 수 없는 문자 제거 
if (filename_old.indexOf(filename_new) != 0) { // 지금 파일 이름이 새 파일 이름으로 시작하지 않을 경우에만 이름을 바꿈.
  filename_new = await get_filename_new(tp.file.folder(true), filename_new);
  await tp.file.rename(filename_new);
}

let path = tp.obsidian.normalizePath(tp.file.path(true)); // true: 상대 경로 얻기
let tfile = app.vault.getAbstractFileByPath(path);

/* frontmatter 바꾸기 */
await app.fileManager.processFrontMatter(tfile, (fm) => { 
  if(title) {
    fm["book title"] = title;
  }
  if(Object.keys(authors).length) {
    // 방법 1.
    // 전체 저자를 authors 아래로 authors, translaters, editors, others 로 넣음.
    fm["authors"] = authors;
     
    // // 방법 2.
    // // 전체 저자를 authors, translaters, editors, others 로 넣음.
    // Object.keys(authors).forEach(authors_key => {
    //     fm[authors_key] = authors[authors_key];
    // });
    
    // // 방법 3.
    // // 전체 저자를 authors 하나에 넣음.
    // let authors_all = [];
    // Object.keys(authors).forEach(authors_key => {
    //     authors_all.push(...authors[authors_key]);
    // });
    // fm["authors"] = authors_all;
  }
  if(cover) {
    fm["cover"] = cover;
  }
  if(category) {
    fm["category"] = category;
  }
  if(publisher) {
    fm["publisher"] = publisher;
  }
  if(publish_date) {
    fm["publish date"] = publish_date;
  }
  if(book_pages) {
    fm["pages"] = book_pages;
  }
  if(isbn) {
    fm["isbn"] = isbn;
  }

  // page title 바꾸기
  let title_old = tp.frontmatter["title"]? tp.frontmatter["title"]: "";
  let title_new = `(Book) ${title} - ${author}`;
  if(title_old != title_new) {
    fm["title"] = title_new;
  }

  // aliases 더하기
  let aliases = tp.frontmatter["aliases"]? tp.frontmatter["aliases"]: [];
  console.log("aliases:", aliases);
  let alias = `(Book) ${title} - ${author}`;
  let aliases_changed = false;
  if(!aliases.includes(alias)) {
    aliases.push(alias);
    aliases_changed = true;
  }
  // 이전 page title을 alias로 넣기
  if(title_old != "" && title_old != "Untitled" && (title_old != title_new) && !aliases.includes(title_old)) {
    aliases.push(title_old);
    aliases_changed = true;
  }
  if(aliases_changed) {
    fm["aliases"] = aliases;
  }
  
  // 태그 더하기.
  // let tags = tp.frontmatter["tags"]? tp.frontmatter["tags"]: [];
  let tags = fm["tags"]? fm["tags"]: [];
  console.log("tags:", tags);
  let tags_new = ["book"]; // 여러 태그를 더 할 수 있도록 배열로 함.
  let tags_changed = false;
  tags_new.forEach( tag => {
    if(!tags.includes(tag)) {
      tags.push(tag);
      tags_changed = true;
    }
  });
  console.log("tags:", tags);
  if(tags_changed) {
    fm["tags"] = tags;
  }
  
  // 다른 책 정보 사이트 주소도 넣을 수 있도록 함.
  let book_urls = tp.frontmatter["book url"]? tp.frontmatter["book url"]: {};
  Object.assign(book_urls, {"교보문고": url});
  fm["book url"] = book_urls;
  
  // 책 정보 사이트 주소.
  let url_info = fm["url"]? fm["url"]: "";
  if(url_info != url) {
    fm["url"] = url;
  }
});

await sleep(300); // milliseconds - frontmatter 넣기와 tR 입력이 동시에 진행 안 되도록

// 제목을 H1으로 넣기
// 주석 처리하면 넣지 않는다. 지금 줄처럼 아래 세 줄 앞에 "// "을 넣는다.
if(title_section && title){
tR += `# ${title}`;
}

if(cover_section && cover){
tR += `
## 표지
![cover](${cover})
`;
}

if(toc_section && toc){
tR += `
## 목차
${toc}
`;
}

return tR;
}

module.exports = get_kyobobook_info;