import os

def create_text(category_name, path, name):
    with open(path, 'r') as content_file:
        source = content_file.read()
    if source == "":
        return
    source_len = len(source)
    global result
    result = ""
    global title
    title = ""
    global begin
    begin = 0
    global end
    end = 0

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
        if c == '#':
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
        if c == '\n' and end + 1 < source_len and source[end + 1] == '\n':
            create_paragraph()
        else:
            advance()
            if end == source_len:
                create_paragraph()
    result_path = category_name + "_" + name + ".html"
    write_page(result_path, title, result)
    return "<a href=\"" + result_path + "\">" + title + "</a><br>"

header_before_title = ""
header_after_title = ""
footer = ""
content_folder = "content"

with open('template.html', 'r') as template_file:
    template = template_file.read()
    title_marker ="%title%"
    title_index = template.find(title_marker)
    header_before_title = template[0:title_index]
    content_marker ="%content%"
    content_index = template.find(content_marker)
    header_after_title = template[title_index + len(title_marker):content_index]
    footer = template[content_index + len(content_marker):len(template)]

def write_page(filename, title, content):
    with open(filename, 'w') as page_file:
        page_file.write(header_before_title)
        if title and title != "Index":
            page_file.write(title + " | Karl Zylinski")
        else:
            page_file.write("Karl Zylinski")
        page_file.write(header_after_title)
        page_file.write(content)
        page_file.write(footer)

for name in os.listdir(content_folder):
    path = content_folder + "/" + name
    if os.path.isfile(path) and path.endswith(".html"):
        with open(path, 'r') as content_file:
            write_page(name, os.path.splitext(name)[0].title(), content_file.read())
    elif not os.path.isfile(path):
        page_title = name.title()
        content = "<h1>" + page_title + "</h1>"
        for sub_name in os.listdir(path):
            sub_path = path + "/" + sub_name
            if os.path.isfile(sub_path):
                content = content + create_text(name, sub_path, sub_name)
        write_page(name + ".html", page_title, content)

