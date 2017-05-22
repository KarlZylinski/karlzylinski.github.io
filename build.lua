local lfs = require "lfs"
local template = io.open("template.html", "r")
local template_text = template:read("*all")
template:close()
local title_marker = "%title%"
local content_marker = "%content%"
local title_index_start, title_index_end = template_text:find(title_marker, nil, true)
local content_index_start, content_index_end = template_text:find(content_marker, nil, true)
local header_before_title = template_text:sub(0, title_index_start - 1)
local header_after_title = template_text:sub(title_index_end + 1, content_index_start - 1)
local footer = template_text:sub(content_index_end + 1, template_text:len())

function write_page(filename, title, content)
    local page = io.open(filename, "w")
    page:write(header_before_title)
    if title and title ~= "Index" then
        page:write(title .. " | Karl Zylinski")
    else
        page:write("Karl Zylinski")
    end
    page:write(header_after_title)
    page:write(content)
    page:write(footer)
    page:flush()
    page:close()
end

function str_ends_with(str, cmp)
    local sl = str:len()
    local cl = cmp:len()
    if sl < cl then
        return false
    end
    if sl == cl and str == cmp then
        return true
    end
    if str:sub(-cl) == cmp then
        return true
    end
    return false
end

function str_title(str)
    local sl = str:len()
    if sl == 1 then
        return str:upper()
    end

    local first = str:sub(1, 1):upper()
    local rest = str:sub(2, sl)
    return first .. rest
end

function create_text(category_name, file, name)
    local source = file:read("*all")
    local source_len = source:len()
    local head = 1

    function advance()
        head = head + 1
    end

    function is_date()
        local lax = source:sub(head, head + 5)
        print(lax)
        return head + 5 < source_len and source:sub(head, head + 5) == "DATE:"
    end

    while head ~= source_len do
        if is_date() then
            local begin = head
            while head ~= source_len and source[head] ~= '\n' do
                advance()
            end
            date_string = source:sub(begin, head)
            print(date_string)
        else
            advance()
        end
    end
end

local content_folder = "content"
for name in lfs.dir(content_folder) do
    if name ~= '.' and name ~= ".." then
        local path = content_folder .. "/" .. name
        local f = io.open(path)
        if f and str_ends_with(path, ".html") then
            local content = f:read("*all")
            local title = str_title(name:sub(1, name:len() - (".html"):len()))
            write_page(name, title, content)
            f:close()
        else
            local title = str_title(name)
            local content = "<h1>" .. title .. "</h1>"
            local created_texts = {}
            for text_filename in lfs.dir(path) do
                if text_filename ~= '.' and text_filename ~= ".." then
                    sub_path = path .. "/" .. text_filename
                    local f = io.open(sub_path)
                    if f then
                        table.insert(created_texts, #created_texts, create_text(name, f, sub_name))
                        f:close()
                    end
                end
            end
        end
    end    
end