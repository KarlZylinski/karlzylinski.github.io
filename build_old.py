#!/usr/bin/env python3

import os
import time
import html
from datetime import datetime
from enum import Enum
import types

UseLatex = Enum('UseLatex', 'yes no')
State = Enum('State', 'final wip')

def get_month_name(num):
    mapping = {
        1: 'januari',
        2: 'februari',
        3: 'mars',
        4: 'april',
        5: 'maj',
        6: 'juni',
        7: 'juli',
        8: 'augusti',
        9: 'september',
        10: 'oktober',
        11: 'november',
        12: 'december'
    }
    return mapping[num]



def create_post(source_path, target_filename):
    if not os.path.isfile(source_path):
        sys.exit("Tried creating post from non-existing file")

    with open(source_path, 'r') as content_file:
        source = content_file.read()

    if source == "":
        sys.exit("Trying to create empty post")

    source_len = len(source)
    result = ""
    title = ""
    date = ""
    date_string = ""
    begin = 0
    end = 0
    state = State.final
    use_latex = UseLatex.no

    def advance():
        nonlocal end
        end = end + 1

    def create_paragraph():
        nonlocal result
        nonlocal end
        nonlocal begin
        paragraph = source[begin:end]
        paragraph_result = ""
        p_begin = 0
        p_end = 0
        paragraph_len = len(paragraph)

        def find_emphasis_end():
            i = p_end + 1
            while i < paragraph_len:
                if paragraph[i] == '_':
                    return i
                i = i + 1
            return -1

        while p_end < paragraph_len:
            c = paragraph[p_end]
            if c == '_':
                paragraph_result = paragraph_result + paragraph[p_begin:p_end]
                p_begin = p_end = p_end + 1
                emph_end = find_emphasis_end()
                if emph_end == -1:
                    paragraph_result = paragraph_result + "_"
                else:
                    paragraph_result = paragraph_result + "<em>" + paragraph[p_end:emph_end] + "</em>"
                    p_begin = p_end = emph_end + 1
            elif c == '-' and p_end + 2 < paragraph_len and paragraph[p_end + 1] == '-' and paragraph[p_end + 2] == '-':
                paragraph_result = paragraph_result + paragraph[p_begin:p_end] + "&mdash;"
                p_begin = p_end = p_end + 3
            else:
                p_end = p_end + 1
                if p_end == paragraph_len:
                    paragraph_result = paragraph_result + paragraph[p_begin:p_end]

        result = result + "<p>" + paragraph_result + "</p>"
        while end != source_len and source[end] == '\n':
            advance()
        begin = end

    def create_heading(start_tag, end_tag, set_title):
        nonlocal result
        nonlocal end
        nonlocal begin
        nonlocal title
        while end != source_len:
            if source[end] == '\n':
                if set_title:
                    title = source[begin:end] # Dont actually add main title...
                else:
                    result = result + start_tag + source[begin:end] + end_tag

                while end != source_len:
                    if source[end] == '\n':
                        advance()
                        break

                begin = end
                return
            else:
                advance()

    def create_unnumbered_list():
        nonlocal result
        nonlocal end
        nonlocal begin

        result = result + "<ul>"

        while True:
            advance()
            
            while source[end] == ' ':
                advance()

            begin = end

            while source[end] != '\n':
                advance()

            result = result + "<li>" + source[begin:end] + "</li>"
            advance()

            if source[end] != '*':
                break

        begin = end
        result = result + "</ul>"

    while end != source_len:
        c = source[end]
        if c == 'D' and end + 4 < source_len and source[end + 1] == 'A' and source[end + 2] == 'T' and source[end + 3] == 'E' and source[end + 4] == ':':
            end = begin = end + 5
            while end != source_len and source[end] != '\n':
                advance()
            date_string = source[begin:end]
            date = time.strptime(date_string, "%B %d, %Y")
            begin = end
        elif c == 'W' and end + 2 < source_len and source[end + 1] == 'I' and source[end + 2] == 'P':
            end = begin = end + 3
            state = State.wip
        elif c == 'K' and end + 4 < source_len and source[end + 1] == 'A' and source[end + 2] == 'T' and source[end + 3] == 'E' and source[end + 4] == 'X':
            end = begin = end + 5
            use_latex = UseLatex.yes
        elif c == 'S' and end + 3 < source_len and source[end + 1] == 'P' and source[end + 2] == 'R' and source[end + 3] == 'E':
            if begin != end:
                create_paragraph()
            result = result + "<pre>"
            end = begin = end + 4
            while end != source_len and source[end] != '\n':
                advance()
            if end != source_len:
                advance()
            begin = end
        elif c == 'E' and end + 3 < source_len and source[end + 1] == 'P' and source[end + 2] == 'R' and source[end + 3] == 'E':
            if begin != end:
                create_paragraph()
            result = result + "</pre>"
            end = begin = end + 4
            while end != source_len and source[end] != '\n':
                advance()
            if end != source_len:
                advance()
            begin = end
        elif c == 'S' and end + 4 < source_len and source[end + 1] == 'H' and source[end + 2] == 'T' and source[end + 3] == 'M' and source[end + 4] == 'L':
            if begin != end:
                create_paragraph()
            while end != source_len:
                advance()
                c = source[end]
                if c == 'E' and end + 4 < source_len and source[end + 1] == 'H' and source[end + 2] == 'T' and source[end + 3] == 'M' and source[end + 4] == 'L':
                    break
            result = result + source[begin + 5:end]
            end = end + 5
            begin = end
        elif c == '#':
            start_tag = "<h1>"
            end_tag = "</h1>"
            set_title = True
            if end + 1 < source_len and source[end + 1] == '#':
                start_tag = "<h2>"
                end_tag = "</h2>"
                end = begin = end + 2
                set_title = False
            else:
                end = begin = end + 1
            create_heading(start_tag, end_tag, set_title)
        elif c == '*' and end > 0 and source[end - 1] == '\n':
            if begin != end:
                create_paragraph()

            create_unnumbered_list()
        elif c == '\n' and end + 1 < source_len and source[end + 1] == '\n':
            create_paragraph()
        else:
            advance()
            if end == source_len:
                create_paragraph()

    result_path = "/post/" + target_filename + ".html"
    dt = datetime.fromtimestamp(time.mktime(date))
    date_to_use = dt.strftime('%e ' + get_month_name(dt.month) + ' %Y')
    standalone_content = str.format("<div class='post'><h1>{0}</h1><div class='post_date'>{1}</div>{2}</div>", title, date_to_use, result);
    write_page(result_path, title, standalone_content, use_latex)
    return dict(date=date, title=title, path=result_path, content=result, use_latex=use_latex, state=state)

header_before_title = ""
header_after_title = ""
footer = ""
content_folder = "content"

with open('template.html', 'r') as template_file:
    template = template_file.read()
    header_marker ="%header%"
    header_index = template.find(header_marker)
    header_before_title = template[0:header_index]
    content_marker ="%content%"
    content_index = template.find(content_marker)
    header_after_title = template[header_index + len(header_marker):content_index]
    footer = template[content_index + len(content_marker):len(template)]

AppendNameToTitle = Enum('AppendNameToTitle', 'yes no')

def filename_prepend_current_dir(path):
    if len(path) == 0:
        return path

    if path[0] == "/" or path[0] == "\\":
        return "." + path

    return path

def write_page(filename, title, content, use_latex, extra_header = None):
    if len(filename) == 0:
        sys.exit("Tried writing page without filename")
        return

    if not isinstance(use_latex, UseLatex):
        sys.exit("use_latex is not of UseLatex enum type")

    with open(filename_prepend_current_dir(filename), 'w') as page_file:
        page_file.write(header_before_title)

        page_file.write("<title>" + title + "</title>")

        if not extra_header == None:
            page_file.write(extra_header)

        if use_latex == UseLatex.yes:
            page_file.write("""\n        <link rel="stylesheet" href="/katex.min.css">
        <script src="/katex.min.js"></script>
        <script src="/auto-render.min.js"></script>
        <script>
        document.addEventListener("DOMContentLoaded", function() {
            renderMathInElement(document.body,
          {
              delimiters: [
                  {left: "$$", right: "$$", display: true},
                  {left: "\\\[", right: "\\\]", display: true},
                  {left: "$", right: "$", display: false},
                  {left: "\\\(", right: "\\\)", display: false}
              ]
          });
        });
        </script>""")

        page_file.write(header_after_title)
        page_file.write(content)
        page_file.write(footer)

# Rest of script if for processing blog posts, making both the index pages and the archive.
posts_path = "raw_posts"
created_posts = []
for post_filename in os.listdir(posts_path):
    post_full_filename = posts_path + "/" + post_filename
    if os.path.isfile(post_full_filename):
        post = create_post(post_full_filename, post_filename)
        if post['state']== State.final:
            created_posts.append(post)
created_posts.sort(key=lambda x: x['date'], reverse=True)

index_content = "<header><h1>Karl skriver saker på Internet</h1></header>"
rss_content = ""
current_index_page = 1
current_index_page_content = ""
current_index_page_use_latex = UseLatex.no
num_posts_per_index = 5

for idx, cp in enumerate(created_posts):
    post_content = cp['content']
    post_title = cp['title']
    post_content_with_title = str.format("<div class=\"post\"><h1>{0}</h1>{1}</div>", post_title, post_content)
    post_filename = cp['path']
    post_link = "http://zylinski.se" + post_filename
    post_date = cp['date']
    dt = datetime.fromtimestamp(time.mktime(post_date))
    date_string = dt.strftime('%e ' + get_month_name(dt.month) + ' %Y')
    date_string_rss = dt.strftime('%d %b %Y')
    index_content += "<a href=\"" + post_filename + "\">" + post_title + " &ndash; " + date_string + "</a><br>"
    rss_content += str.format("<item><title>{0}</title><link>{1}</link><pubDate>{2}</pubDate><description>{3}</description></item>", post_title, post_link, date_string_rss, html.escape(post_content))

index_content = index_content + "<div class='index_footer'>Copyright finns inte &mdash; Kontakt: karl@zylinski.se &mdash; <a href='http://zylinski.se/rss'>RSS</a>"
index_header = """
 <meta http-equiv="cache-control" content="no-cache, must-revalidate, post-check=0, pre-check=0" />
  <meta http-equiv="cache-control" content="max-age=0" />
  <meta http-equiv="expires" content="0" />
  <meta http-equiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT" />
  <meta http-equiv="pragma" content="no-cache" />
"""


write_page("index.html", "Karl skriver saker på Internet", index_content, UseLatex.no, index_header)

current_date = datetime.fromtimestamp(time.mktime(time.localtime())).strftime("%d %b %Y")

rss_header = """<?xml version='1.0' encoding='UTF-8'?>
<rss version='2.0'>
<channel>
<title>Karl Zylinski</title>
<link>http://zylinski.se</link>
<description>Karl Zylinski's blog</description>
<language>en</language>
<lastBuildDate>""" + current_date + """</lastBuildDate>
"""

rss_footer = """
</channel>
</rss>
"""

with open("rss", 'w') as rss_file:
    rss_file.write(rss_header + rss_content + rss_footer)
