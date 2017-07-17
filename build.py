import os
import time

def create_text(category_name, path, name):
    with open(path, 'r') as content_file:
        source = content_file.read()
    if source == "":
        return
    source_len = len(source)
    global result
    result = "<div class='writing'>"
    global title
    title = ""
    date = ""
    date_string = ""
    global begin
    begin = 0
    global end
    end = 0
    global use_latex
    use_latex = False

    def advance():
        global end
        end = end + 1

    def create_paragraph():
        global result
        global end
        global begin
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
            else:
                p_end = p_end + 1
                if p_end == paragraph_len:
                    paragraph_result = paragraph_result + paragraph[p_begin:p_end]

        result = result + "<p>" + paragraph_result + "</p>"
        while end != source_len and source[end] == '\n':
            advance()
        begin = end

    def create_heading(start_tag, end_tag, set_title):
        global result
        global end
        global begin
        global title
        while end != source_len:
            if source[end] == '\n':
                result = result + start_tag + source[begin:end] + end_tag

                if set_title:
                    title = source[begin:end]

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
            result = result + "<p><em>" + date_string + "</em></p>"
            date = time.strptime(date_string, "%B %d, %Y")
            begin = end
        elif c == 'K' and end + 4 < source_len and source[end + 1] == 'A' and source[end + 2] == 'T' and source[end + 3] == 'E' and source[end + 4] == 'X':
            end = begin = end + 5
            use_latex = True
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

    result = result + "</div>"
    result_path = category_name + "_" + name + ".html"
    write_page(result_path, title, result, use_latex)
    return [date, "<a href=\"" + result_path + "\">" + title + " &ndash; " + date_string + "</a><br>"]

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

def write_page(filename, title, content, use_latex):
    with open(filename, 'w') as page_file:
        page_file.write(header_before_title)
        title_str = "Karl Zylinski"

        if title and title != "Index":
           title_str = title + " | Karl Zylinski"

        page_file.write("<title>" + title_str + "</title>")

        if use_latex:
            page_file.write("""\n        <link rel="stylesheet" href="katex.min.css">
        <script src="katex.min.js"></script>
        <script src="auto-render.min.js"></script>
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

for name in os.listdir(content_folder):
    path = content_folder + "/" + name
    if os.path.isfile(path) and path.endswith(".html"):
        with open(path, 'r') as content_file:
            write_page(name, os.path.splitext(name)[0].title(), content_file.read(), False)
    elif not os.path.isfile(path):
        page_title = name.title()
        content = "<h1>" + page_title + "</h1>"
        created_texts = []
        for sub_name in os.listdir(path):
            sub_path = path + "/" + sub_name
            if os.path.isfile(sub_path):
                created_texts.append(create_text(name, sub_path, sub_name))
        created_texts.sort(key=lambda x: x[0], reverse=True)
        for ct in created_texts:
            content += ct[1]
        write_page(name + ".html", page_title, content, False)

