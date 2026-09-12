-- Ek PDF me kai questions ho sakte hain, to card ko batana hoga ki kahan se kholna hai.
--
-- GS Score ki booklets me ek page par teen questions chhape hote hain, 3.(a),
-- 3.(b), 3.(c), aur unke answers usi booklet me ek ke baad ek likhe hote hain.
-- Pages kaat kar alag karna khatarnak hai, kyunki answers page ke beech me shuru
-- hote hain aur galat cut se reader ka answer PDF me bachega hi nahi.
--
-- Isliye teeno questions ek hi PDF point karte hain, aur ye column batata hai ki
-- us question ka answer kis page se shuru hota hai. Viewer wahin scroll kar deta
-- hai. Agar page number thoda galat bhi ho, to nuksaan nahi: answer PDF me hai,
-- reader bas thoda upar neeche kar lega.
--
-- NULL ya 1 ka matlab shuru se kholo, jo har purane row ke liye sahi hai.

alter table topper_copies
  add column if not exists start_page integer;

comment on column topper_copies.start_page is
  'Is question ka answer PDF ke kis page se shuru hota hai. NULL = pehla page.';
