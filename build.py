content_files = ["index", "games", "contact"]#, "music", "drawings", "photos"]

with open('template.html', 'r') as template_file:
    template = template_file.read()
    content_marker ="%%%"
    content_index = template.find(content_marker)
    content_header = template[0:content_index]
    content_footer = template[content_index + len(content_marker):len(template)]
    for name in content_files:
        with open(name + "_content.html", 'r') as content_file:
            content = content_file.read()
            with open(name + ".html", 'w') as page_file:
                page_file.write(content_header)
                page_file.write(content)
                page_file.write(content_footer)
