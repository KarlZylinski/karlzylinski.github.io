#!/usr/bin/env python3

import os
import time
import html
from datetime import datetime
from enum import Enum
import sys

dev = len(sys.argv) > 1 and sys.argv[1] == "dev"

UseKatex = Enum('UseKatex', 'yes no')
Publish = Enum('Publish', 'yes no')

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

template_file = open('template.html', 'r')
template = template_file.read()
template_file.close()

header_marker = "%header%"
header_index = template.find(header_marker)
header_before_title = template[0:header_index]
content_marker = "%content%"
content_index = template.find(content_marker)
header_after_title = template[header_index + len(header_marker):content_index]
footer = template[content_index + len(content_marker):len(template)]

posts_path = "raw_posts"
created_posts = []

def parse_post(source_path):
    class ParserState:
        i = 0
        i_last_consumed = 0
        result = ""
        source = ""
        source_len = 0
        use_katex = UseKatex.no
        publish = Publish.yes
        date = None
        title = None
    
    ps = ParserState()
    source_file = open(source_path, 'r')
    ps.source = source_file.read()
    ps.source_len = len(ps.source)
    source_file.close()

    def step(ps, num = 1):
        ps.i = ps.i + num

    def step_to_newline(ps):
        while ps.i != ps.source_len and ps.source[ps.i] != '\n':
            step(ps)

    def check_str(ps, s):
        if ps.source_len < ps.i + len(s):
            return False

        for si in range(0, len(s)):
            if ps.source[ps.i + si] != s[si]:
                return False

        return True

    def check_line(ps, s):
        i = ps.i
        begin = ps.i

        # dont use step_to_newline here as it consumes chars!
        while i != ps.source_len and ps.source[i] != '\n':
            i = i + 1

        return ps.source[begin:i].strip() == s

    def consume(ps):
        ps.i_last_consumed = ps.i

    def parse_paragraph(ps):
        if ps.i_last_consumed == ps.i:
            return ""

        pps = ParserState() # paragraph parser state
        pps.source = ps.source[ps.i_last_consumed:ps.i]
        pps.source_len = len(pps.source)
        
        def parse_emphasis(pps):
            step(pps)
            emph_begin = pps.i
            emph_end = pps.source.find("_", pps.i + 1)
            if emph_end == -1:
                return None
            pps.i = emph_end + 1
            consume(pps)
            return "<em>" + pps.source[emph_begin:emph_end] + "</em>"

        def parse_mdash(pps):
            step(pps, 3)
            consume(pps)
            return "&mdash;"

        def flush(pps):
            add_to_result(pps, pps.source[pps.i_last_consumed:pps.i])
            consume(pps)

        while pps.i != pps.source_len:
            if check_str(pps, "_"):
                flush(pps)
                emph = parse_emphasis(pps)

                if emph == None:
                    step(pps)
                else:
                    add_to_result(pps, emph)
            elif check_str(pps, "---"):
                flush(pps)
                add_to_result(pps, parse_mdash(pps))
            else:
                step(pps)

        flush(pps)

        if pps.result.strip() == "":
            return ""

        return "<p>" + pps.result + "</p>"

    def parse_date(ps):
        step(ps, 5) # DATE:
        begin = ps.i
        step_to_newline(ps)
        consume(ps)
        date_str = ps.source[begin:ps.i]
        return time.strptime(date_str, "%B %d, %Y")

    def parse_wip(ps):
        step_to_newline(ps)
        consume(ps)
        return Publish.no

    def parse_katex(ps):
        step_to_newline(ps)
        consume(ps)
        return UseKatex.yes

    def parse_pre(ps):
        step(ps, 4)
        begin = ps.i
        end = ps.source.find("EPRE", ps.i)
        
        if end == -1:
            sys.exit("SPRE without EPRE!")

        pre_text = ps.source[begin:end]
        ps.i = end + 4
        consume(ps)
        return "<pre>" + pre_text + "</pre>"

    def parse_heading(ps):
        num_hashs = 0

        while ps.source[ps.i] == "#":
            num_hashs = num_hashs + 1
            step(ps)

        begin = ps.i
        consume(ps)
        step_to_newline(ps)
        heading_text = ps.source[ps.i_last_consumed:ps.i]
        heading = "<h%d>%s</h%d>" % (num_hashs, heading_text, num_hashs)
        consume(ps)

        if num_hashs == 1 and ps.title == None:
            ps.title = heading_text

        return heading

    def parse_unnumbered_list(ps):
        out = "<ul>"

        while True:
            step(ps)
            
            while ps.source[ps.i] == ' ':
                step(ps)

            consume(ps)
            step_to_newline(ps)
            out = out + "<li>" + ps.source[ps.i_last_consumed:ps.i] + "</li>"
            step(ps)

            if ps.source[ps.i] != '*':
                break

        consume(ps)
        out = out + "</ul>"
        return out

    def add_to_result(ps, content):
        ps.result = ps.result + content

    def is_newline(ps):
        if ps.i == 0:
            return True
        return ps.source[ps.i - 1] == '\n' and ps.source[ps.i] != '\n'

    def flush(ps):
        add_to_result(ps, parse_paragraph(ps))
        consume(ps)

    while ps.i != ps.source_len:
        if is_newline(ps) and check_str(ps, "#"):
            flush(ps)
            add_to_result(ps, parse_heading(ps))
        elif is_newline(ps) and check_str(ps, "DATE:"):
            flush(ps)
            ps.date = parse_date(ps)
            dt = datetime.fromtimestamp(time.mktime(ps.date))
            date_str = dt.strftime('%e ' + get_month_name(dt.month) + ' %Y')
            add_to_result(ps, "<em class='date'>%s</em>" % date_str)
        elif is_newline(ps) and check_line(ps, "WIP"):
            flush(ps)
            ps.publish = parse_wip(ps)
        elif is_newline(ps) and check_line(ps, "KATEX"):
            ps.use_katex = parse_katex(ps)
        elif is_newline(ps) and check_line(ps, "SPRE"):
            flush(ps)
            add_to_result(ps, parse_pre(ps))
        elif is_newline(ps) and check_str(ps, "*"):
            flush(ps)
            add_to_result(ps, parse_unnumbered_list(ps))
        elif check_str(ps, "\n\n"):
            flush(ps)
            step(ps, 2) # step past double line break
            consume(ps)
        else:
            step(ps)

    if ps.i != ps.i_last_consumed:
        add_to_result(ps, parse_paragraph(ps))

    return dict(date=ps.date, title=ps.title, content="<div class='post'>" + ps.result + "</div>", use_katex=ps.use_katex, publish=ps.publish)


def write_page(filename, title, content, use_katex, extra_header = None, resource_rel_path = ""):
    with open(filename, 'w') as page_file:
        page_file.write(header_before_title.replace("%resource_rel_path%", resource_rel_path))

        page_file.write("<title>" + title + "</title>")

        if extra_header != None:
            page_file.write(extra_header)

        if use_katex == UseKatex.yes:
            page_file.write("""\n        <link rel="stylesheet" href="%s/katex.min.css">
        <script src="%s/katex.min.js"></script>
        <script src="%s/auto-render.min.js"></script>
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
        </script>""" % (resource_rel_path, resource_rel_path, resource_rel_path))

        page_file.write(header_after_title)
        page_file.write(content)
        page_file.write(footer)

for post_filename in os.listdir(posts_path):
    post_full_filename = posts_path + "/" + post_filename

    if os.path.isfile(post_full_filename):
        post = parse_post(post_full_filename)
        output_full_filename = "post/" + post_filename + ".html"

        resource_rel_path = ""
        if dev:
            resource_rel_path = ".."

        post['path'] = output_full_filename
        write_page(output_full_filename, post['title'], post['content'], post['use_katex'], None, resource_rel_path)

        if post['publish']== Publish.yes:
            created_posts.append(post)

created_posts.sort(key=lambda x: x['date'], reverse=True)

index_content = "<h1>Karl skriver saker på Internet</h1>"
rss_content = ""

resource_rel_path = ""
if dev:
    resource_rel_path = "."

for idx, cp in enumerate(created_posts):
    post_content = cp['content']
    post_title = cp['title']
    post_content_with_title = str.format("<div class=\"post\"><h1>{0}</h1>{1}</div>", post_title, post_content)
    post_filename = cp['path']
    post_link = "http://zylinski.se/" + post_filename
    post_date = cp['date']
    dt = datetime.fromtimestamp(time.mktime(post_date))
    date_string = dt.strftime('%e ' + get_month_name(dt.month) + ' %Y')
    date_string_rss = dt.strftime('%d %b %Y')
    index_content += "<a href=\"" + resource_rel_path + "/" + post_filename + "\">" + post_title + " &ndash; " + date_string + "</a><br>"
    rss_content += str.format("<item><title>{0}</title><link>{1}</link><pubDate>{2}</pubDate><description>{3}</description></item>", post_title, post_link, date_string_rss, html.escape(post_content))

index_content = index_content + "<p class='index_footer'>Copyright finns inte &mdash; Kontakt: <a href='mailto:karl@zylinski.se'>karl@zylinski.se</a> &mdash; <a href='http://zylinski.se/rss'>RSS</a></p>"
index_header = """
 <meta http-equiv="cache-control" content="no-cache, must-revalidate, post-check=0, pre-check=0" />
  <meta http-equiv="cache-control" content="max-age=0" />
  <meta http-equiv="expires" content="0" />
  <meta http-equiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT" />
  <meta http-equiv="pragma" content="no-cache" />
"""

write_page("index.html", "Karl skriver saker på Internet", index_content, UseKatex.no, index_header, resource_rel_path)

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
