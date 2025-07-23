// <%_*
// const title = tp.frontmatter["title"];
// const authors = tp.frontmatter["authors"];
// console.log(title);
// console.log(authors);

async function search_kyobobook(tp, title = "", authors = "") {

// 교보문고  
// https://search.kyobobook.co.kr/search?keyword=%EC%82%AC%ED%94%BC%EC%97%94%EC%8A%A4%20%EC%9C%A0%EB%B0%9C%20%ED%95%98%EB%9D%BC%EB%A6%AC&target=total&gbCode=TOT&len=100  
// https://search.kyobobook.co.kr/search?keyword=사피엔스%20유발%20하라리&target=total&gbCode=TOT&len=100

let url_search = `https://search.kyobobook.co.kr/search?keyword=${encodeURIComponent([title, authors].join(" "))}&target=total&gbCode=TOT&len=100`;
console.log(url_search);

let response;
try {
  response = await request({ url: url_search });
} catch(e) {
  console.log("에러 발생 - request");
  console.log(e);
  alert("에러 발생 - request\n\n" + e +"\n\n옵시디언을 다시 시작해 보세요.");
  return;
}
// console.log("response:", response);

const parser = new DOMParser();
const doc = parser.parseFromString(response, "text/html");

let prod_items = doc.querySelectorAll("#shopData_list .prod_list .prod_item");
// console.log(prod_items);

// import { App, Notice, SuggestModal } from "obsidian";
const { App, Notice, SuggestModal } = tp.obsidian;

const ALL_BOOKS = [];

const BOOKS_DETAIL = {};

for(let prod_item of prod_items) {
  // 체크박스에 pid와 bid가 없는 경우 무시
  if(!prod_item.querySelectorAll("input[data-pid][data-bid]")[0]) {
    continue;
  }
  // 상품 카테고리가 [패키지]이면 무시
  if(prod_item.querySelectorAll(".prod_category")[0].innerText.trim() == "[패키지]") {
    continue;
  }
  
  let book = {};
  book.title = prod_item.querySelectorAll(".prod_info")[0].innerText.replace(/\s{2,}/g, " ").trim();
  book.authors = prod_item.querySelectorAll(".prod_author_group .auto_overflow_inner")[0].innerText.replace(/\s{2,}/g, " ").trim();
  book.publisher = prod_item.querySelectorAll(".prod_publish a")[0].innerText.trim();
  book.date = prod_item.querySelectorAll(".prod_publish .date")[0].innerText.trim();
  book.pid = prod_item.querySelectorAll("input[data-pid][data-bid]")[0].dataset.pid;

  ALL_BOOKS.push(book);

  let detail = {};
  detail.bid = prod_item.querySelectorAll("input[data-pid][data-bid]")[0].dataset.bid;
  detail.url = prod_item.querySelectorAll(".prod_info")[0].href;

  BOOKS_DETAIL[book.pid] = detail;
}
// console.log(ALL_BOOKS);
// console.log(BOOKS_DETAIL);

class ListModal extends SuggestModal {
  
  constructor(app, onSubmit) {
    super(app);
    this.onSubmit = onSubmit;
  }

  // Returns all available suggestions.
  getSuggestions(query) {
    return ALL_BOOKS.filter((book) => 
      // book.title.toLowerCase().includes(query.toLowerCase())
      book.title.toLowerCase().includes(query.toLowerCase()) || book.authors.toLowerCase().includes(query.toLowerCase()) || book.publisher.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  // Renders each suggestion item.
  renderSuggestion(book, el) {
    // console.log(book);
    let bid = BOOKS_DETAIL[book.pid].bid;
    let img = el.createEl("img", { text: book.title });
    img.src = `https://contents.kyobobook.co.kr/sih/fit-in/200x0/pdt/${bid}.jpg`;
    let div = el.createDiv();
    div.createEl("div", { text: book.title });
    div.createEl("div", { text: book.authors });
    div.createEl("div", { text: book.publisher });
    div.createEl("div", { text: book.date });
    let url = BOOKS_DETAIL[book.pid].url;
    let link = div.createEl("a", { text: url });
    link.href = url;
  }

  // Perform action on the selected suggestion.
  onChooseSuggestion(book, evt) {
    new Notice(`Selected ${book.title}\n${BOOKS_DETAIL[book.pid].url}`);
    console.log(`Selected ${book.title}\n${BOOKS_DETAIL[book.pid].url}`);
    this.onSubmit(BOOKS_DETAIL[book.pid].url);
  }

  onClose() {
    console.log("close!!!!");
    let { contentEl } = this;
    contentEl.empty();
  }
}

let book_url = await new Promise((resolve, reject) => {
  let listModal = new ListModal(app, function(url) {
    if(url) {
      resolve(url);
    }
    else {
      reject("");
    }
  });
  listModal.containerEl.createEl("style", { text: `
  .suggestion-item {display:flex;}
  /*.suggestion-item.is-selected {background-color: orange;}*/
  .suggestion-item img { float: left; width: 100px; margin-right: 10px; }
  `});
  // console.log(listModal);
  
  listModal.open();
});

console.log("book_url:", book_url);

return book_url;
}
module.exports = search_kyobobook;

// _%>