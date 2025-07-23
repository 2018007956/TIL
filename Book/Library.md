---

---
```dataview
table without id 
	("![|80](" + cover_url + ")") as Cover,
	("[[" + file.path + "|" + title + "]]") as Title,
	author as Authors,
	start_read_date as Date,
	default(rate, "") + padright("", default(rating, 0), "⭐")  as Rating
from "Books"
```
