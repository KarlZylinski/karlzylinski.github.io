window.onload = function() {
    var canvas = document.getElementById("bezier-canvas")
    var canvasWidth = canvas.width
    var canvasHeight = canvas.height
    var context = canvas.getContext("2d")
    var canvasData = context.getImageData(0, 0, canvasWidth, canvasHeight)

    function drawPixel (x, y, r, g, b, a) {
        if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight)
            return

        var index = (Math.floor(x) + Math.floor(y) * canvasWidth) * 4
        canvasData.data[index + 0] = r
        canvasData.data[index + 1] = g
        canvasData.data[index + 2] = b
        canvasData.data[index + 3] = a
    }

    function clearCanvas() {
        context.fillStyle="#222";
        context.fillRect(0, 0, canvas.width, canvas.height)
        canvasData = context.getImageData(0, 0, canvasWidth, canvasHeight)
    }

    function updateCanvas() {
        context.putImageData(canvasData, 0, 0)
    }

    var controlPoints = [
        [120, 160],
        [35, 200],
        [220, 260],
        [220, 40]
    ]

    var draggedControlPoint = null;

    canvas.addEventListener("mousedown", function(evt) {
        var x = evt.clientX
        var y = evt.clientY

        if (evt.button == 1)
        {
            controlPoints.push([x, y])
            render()
            return
        }

        for (var i = 0; i < controlPoints.length; ++i) {
            var cp = controlPoints[i]

            if (x > cp[0] - 5 && x < cp[0] + 5
                && y > cp[1] - 5 && y < cp[1] + 5) {
                draggedControlPoint = cp;

                function updateControlPoint(evt) {
                    controlPoints[i][0] = Math.max(Math.min(evt.clientX, canvasWidth), 0)
                    controlPoints[i][1] = Math.max(Math.min(evt.clientY, canvasHeight), 0)
                    render()
                }

                document.addEventListener("mousemove", updateControlPoint)

                document.addEventListener("mouseup", function(evt) {
                    draggedControlPoint = null;
                    document.removeEventListener("mousemove", updateControlPoint);
                    render()
                })

                return
            }
        }
    }, false)

    function calculateBezierPoint(t, p0, p1, p2, p3) {
        var tInv = 1.0 - t
        var tInv2 = tInv * tInv
        var tInv3 = tInv * tInv * tInv
        var t2 = t * t
        var t3 = t * t * t
        var x = p0[0] * tInv3 + p1[0] * 3 * tInv2 * t + p2[0] * 3 * tInv * t2 + p3[0] * t3
        var y = p0[1] * tInv3 + p1[1] * 3 * tInv2 * t + p2[1] * 3 * tInv * t2 + p3[1] * t3
        return [x, y]
    }

    function render() {
        clearCanvas()

        for (var i = 0; i < controlPoints.length - 3; i += 3) {
            var t = 0.0

            while (t <= 1.0) {
                var point = calculateBezierPoint(t, controlPoints[i], controlPoints[i + 1], controlPoints[i + 2], controlPoints[i + 3])
                drawPixel(point[0], point[1], 200, 200, 255, 255)
                t += 1.0/canvasWidth
            }
        }

        for (var i = 0; i < controlPoints.length; ++i) {
            var cp = controlPoints[i]
            for (var x = cp[0] - 3; x < cp[0] + 3; ++x) {
                for (var y = cp[1] - 3; y < cp[1] + 3; ++y)
                {
                    if (draggedControlPoint != null && draggedControlPoint == cp)
                        drawPixel(x, y, 200, 0, 255, 255)
                    else
                        drawPixel(x, y, 255, 200, 0, 255)
                }
            }
        }

        updateCanvas()
    }
    
    render()
}