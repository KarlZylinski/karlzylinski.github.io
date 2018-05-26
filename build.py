import os
import time
import html
from datetime import datetime
from enum import Enum
import types

UseLatex = Enum('UseLatex', 'yes no')
State = Enum('State', 'final wip')

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
        elif c == '\n' and end + 1 < source_len and source[end + 1] == '\n':
            create_paragraph()
        else:
            advance()
            if end == source_len:
                create_paragraph()

    result_path = "/post/" + target_filename + ".html"
    standalone_content = str.format("<div class='standalone_post'><div class='standalone_date'>{1}</div><h1>{0}</h1>{2}</div>", title, date_string, result);
    write_page(result_path, title, standalone_content, use_latex, AppendNameToTitle.yes)
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

def write_page(filename, title, content, use_latex, append_name_to_title):
    if len(filename) == 0:
        sys.exit("Tried writing page without filename")
        return

    if not isinstance(use_latex, UseLatex):
        sys.exit("use_latex is not of UseLatex enum type")

    if not isinstance(append_name_to_title, AppendNameToTitle):
        sys.exit("append_name_to_title is not of AppendNameToTitle enum type")

    with open(filename_prepend_current_dir(filename), 'w') as page_file:
        page_file.write(header_before_title)
        title_str = title

        if len(title) != 0 and append_name_to_title == AppendNameToTitle.yes:
           title_str = title + " | Karl Zylinski"

        page_file.write("<title>" + title_str + "</title>")

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

# Processes all non-blog-pages.
for name in os.listdir(content_folder):
    path = content_folder + "/" + name
    if os.path.isfile(path) and path.endswith(".html"):
        with open(path, 'r') as content_file:
            write_page(name, os.path.splitext(name)[0].title(), content_file.read(), UseLatex.no, AppendNameToTitle.yes)

# Rest of script if for processing blog posts, making both the index pages and the archive.
posts_path = "content/posts"
created_posts = []
for post_filename in os.listdir(posts_path):
    post_full_filename = posts_path + "/" + post_filename
    if os.path.isfile(path):
        post = create_post(post_full_filename, post_filename)
        if post['state']== State.final:
            created_posts.append(post)
created_posts.sort(key=lambda x: x['date'], reverse=True)

archive_content = "<h1>Archive</h1>"
rss_content = ""
current_index_page = 1
current_index_page_content = ""
current_index_page_use_latex = UseLatex.no
num_posts_per_index = 5

for idx, cp in enumerate(created_posts):
    post_content = cp['content']
    post_title = cp['title']
    post_content_with_title = str.format("<h1>{0}</h1>{1}", post_title, post_content)
    post_filename = cp['path']
    post_link = "http://zylinski.se" + post_filename
    post_date = cp['date']
    dt = datetime.fromtimestamp(time.mktime(post_date))
    date_string = dt.strftime('%B %e, %Y')
    date_string_rss = dt.strftime('%d %b %Y')
    archive_content += "<a href=\"" + post_filename + "\">" + post_title + " &ndash; " + date_string + "</a><br>"
    rss_content += str.format("<item><title>{0}</title><link>{1}</link><pubDate>{2}</pubDate><description>{3}</description></item>", post_title, post_link, date_string_rss, html.escape(post_content))
    current_index_page_content += "<div class='index_post'>" + "<a class='index_date' href='" + post_filename + "'>" + date_string + "</a>" + post_content_with_title + "</div>"

    if cp['use_latex'] == UseLatex.yes:
        current_index_page_use_latex = UseLatex.yes

    if (idx + 1) % num_posts_per_index == 0 or (idx + 1) == len(created_posts):
        out_name = "posts_" + str(current_index_page) + ".html";
        page_title = "posts"
        page_title = "Karl Zylinski"
        add_prev_button = current_index_page != 1
        add_next_button = idx + 1 < len(created_posts)
        current_index_page_content += "<div class='index_nav_buttons'>"

        if add_prev_button:
            href = ("index_" + str(current_index_page - 1) + ".html") if current_index_page > 2 else "index.html"
            current_index_page_content += "<a class=\"prev_button\" href=\"" + href + "\">Newer posts</a>"

        if add_next_button:
            current_index_page_content += "<a class=\"next_button\" href=\"index_" + str(current_index_page + 1) + ".html\">Older posts</a>"

        current_index_page_content += "</div><div style='clear:both'></div>"

        if current_index_page == 1:
            out_name = "index.html"
            write_page(out_name, page_title, current_index_page_content, current_index_page_use_latex, AppendNameToTitle.no)
            write_page("index.html", page_title, current_index_page_content, current_index_page_use_latex, AppendNameToTitle.no)
        else:
            write_page("index_" + str(current_index_page) + ".html", page_title, current_index_page_content, current_index_page_use_latex, AppendNameToTitle.no)

        current_index_page_content = ""
        current_index_page_use_latex = UseLatex.no
        current_index_page += 1

write_page("archive.html", "Archive", archive_content, UseLatex.no, AppendNameToTitle.yes)

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