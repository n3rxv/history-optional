import re

html = """<h2>The Maratha Confederacy (18th Century)</h2>
<p>The nature of Maratha political power evolved through three distinct phases, culminating in the Maratha Confederacy after 1761.</p>
<h3>From Centralised State to Confederacy</h3>
<ul>
<li>&#8226; Under Shivaji, the Maratha state was centralised with power concentrated in the king.</li>
<li>&#8226; Due to weak successors of Shivaji, the <strong>Ashtapradhan and the office of Peshwas became hereditary</strong>.</li>
<li>&#8226; By the <strong>Sangola agreement of 1750</strong>, the Peshwa emerged as the real and effective head of the state and the Chatrapati became a <strong>&#8216;Roi Faineant&#8217;</strong> (do-nothing King).</li>
<li>&#8226; The centralised state system lost relevance and a <strong>feudal polity based on landed aristocracy</strong> emerged.
<ul>
<li style="padding-left:2em">&#9702; Deshmukhs became important.</li>
<li style="padding-left:2em">&#9702; Maratha chiefs like Nimbalkar, Holkar, Gaekwad, Bhonsle etc became powerful. They were headed by the Peshwa.</li>
</ul>
</li>
</ul>
<h3>Phase III (From 1761) &#8211; Maratha Confederacy</h3>
<ul>
<li>&#8226; The feudal system which began under the Peshwas, culminated in the Maratha confederacy which comprised of:
<ul>
<li style="padding-left:2em">&#9702; Peshwa of Poona</li>
<li style="padding-left:2em">&#9702; Sindhia of Gwalior</li>
<li style="padding-left:2em">&#9702; Gaekwad of Baroda</li>
<li style="padding-left:2em">&#9702; Bhonsle of Nagpur</li>
<li style="padding-left:2em">&#9702; Holkars of Indore</li>
</ul>
</li>
<li>&#8226; Although the Peshwa remained the head, in principle, Maratha chiefs like Gaekwad, Holkar, Sindhia, Bhonsle, etc. became almost sovereign.</li>
<li>&#8226; So, there emerged a number of parallel powers as these chiefs were almost autonomous in their rights, which considerably <strong>undermined the powers of Peshwas</strong>.</li>
</ul>"""

with open('lib/noteContent.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old = "'eighteenth-century': ``"
new = "'eighteenth-century': `" + html + "`"

count = content.count(old)
print(f"Found {count} occurrence(s) of target string")

if count == 1:
    content = content.replace(old, new, 1)
    with open('lib/noteContent.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced 1 occurrence(s). Done.")
else:
    print("ERROR: Expected exactly 1 occurrence. Aborting.")
