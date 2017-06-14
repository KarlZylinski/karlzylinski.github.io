local lfs = require "lfs"
local template = io.open("template.html", "r")
local template_text = template:read("*all")
template:close()
local header_marker = "%header%"
local content_marker = "%content%"
local header_index_start, header_index_end = template_text:find(header_marker, nil, true)
local content_index_start, content_index_end = template_text:find(content_marker, nil, true)
local header_before_title = template_text:sub(0, header_index_start - 1)
local header_after_title = template_text:sub(header_index_end + 1, content_index_start - 1)
local footer = template_text:sub(content_index_end + 1, template_text:len())

function write_page(filename, title, content, use_latex)
    local page = io.open(filename, "w")
    page:write(header_before_title)
    title_str = "Karl Zylinski"
    if title and title ~= "Index" then
        title_str = title .. " | Karl Zylinski"
    end
    if use_latex then
        page:write([[\n        <link rel="stylesheet" href="katex.min.css">
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
        </script>]])
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

    function current()
        return source:sub(head, head)
    end

    local function get_index(tab, val)
        for index, value in ipairs(tab) do
            if value == val then
                return index
            end
        end

        return 0
    end

    function parse_date()
        function parse_month()
            local begin = head
            local stop_at = run_to_str(" ")
            local m = source:sub(begin, stop_at)

            month_table = {
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December"
            }

            return get_index(month_table, m)
        end

        function parse_day()
            run_to_non_space()
            local begin = head
            local stop_at = run_to_str(",")
            local d = source:sub(begin, stop_at)
            return tonumber(d)
        end

        function parse_year()
            local begin = head
            local stop_at = string.find(source, " ?\r?\n", head)
            head = stop_at
            local y = source:sub(begin, stop_at - 1)
            return tonumber(y)
        end

        local str_start = run_to_non_space() + 1
        local m = parse_month()

        if m == nil or m == 0 then
            error("Malformed date (month).")
        end

        local d = parse_day()

        if d == nil or d == 0 then
            error("Malformed date (day).")
        end

        run_to_non_space()

        if current() ~= "," then
            error("Malformed date (no comma).")
        end

        advance() -- skip comma

        run_to_non_space()

        local y = parse_year()

        if y == nil or y == 0 then
            error("Malformed date (year).")
        end

        local str = source:sub(str_start, head - 1)
        local date_num = os.time{year=y, month=m, day=d}
        return date_num, str
    end

    function run_to_non_space()
        while head <= source_len and source:sub(head, head) == " " do
            advance()
        end
        return head - 1
    end

    function run_to_str(char)
        while head <= source_len and source:sub(head, head) ~= char do
            advance()
        end
        return head - 1
    end

    function run_to_eol()
        local e = string.find(source, "\r?\n", head)
        head = e
        return e - 1
    end

    function is(str)
        return head + #str - 1 <= source_len and source:sub(head, head + #str - 1) == str
    end

    local date_num = 0
    local date_str = 0
    local use_latex = false
    local result = ""
    while head ~= source_len do
        if is("DATE:") then
            head = head + 5
            date_num, date_str = parse_date()
            result = result + "<p><em>" + date_str + "</em></p>"
        if is("KATEX") then
            head = head + 5
            use_latex = true
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
            write_page(name, title, content, false)
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