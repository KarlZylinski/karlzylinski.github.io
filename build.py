import os, os.path

with open('template.html', 'r') as template_file:
    template = template_file.read()
    content_marker ="%%%"
    content_index = template.find(content_marker)
    content_header = template[0:content_index]
    content_footer = template[content_index + len(content_marker):len(template)]
    content_folder = "content"
    for name in [f for f in os.listdir(content_folder) if os.path.isfile(content_folder + "/" + f) and f.endswith(".html")]:
        path = content_folder + "/" + name
        with open(path, 'r') as content_file:
            content = content_file.read()
            with open(name, 'w') as page_file:
                page_file.write(content_header)
                page_file.write(content)
                page_file.write(content_footer)
