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

    function createCurve(p1, p2, controlPoint1, controlPoint2) {
        return {
            point1: p1,
            point2: p2,
            controlPoint1: controlPoint1,
            controlPoint2: controlPoint2
        }
    }

    var curves = []
    curves.push(createCurve([120, 160], [220, 40], [35, 200], [220, 260]))
    var draggedControlPoint = null

    var PointType = {
        Point1: 0,
        Point2: 1,
        ControlPoint1: 2,
        ControlPoint2: 3
    }

    function getPointFromType(curve, type) {
        if (type == PointType.Point1)
            return curve.point1

        if (type == PointType.Point2)
            return curve.point2

        if (type == PointType.ControlPoint1)
            return curve.controlPoint1

        if (type == PointType.ControlPoint2)
            return curve.controlPoint2
    }

    function tryDragPoint(mouseX, mouseY, curve, pointType) {
        var point = getPointFromType(curve, pointType)

        if (mouseX < point[0] - 5 || mouseX > point[0] + 5 || mouseY < point[1] - 5 || mouseY > point[1] + 5)
            return false

        draggedControlPoint = point;

        function updateControlPoint(evt) {
            var newX = Math.max(Math.min(evt.clientX, canvasWidth), 0)
            var newY = Math.max(Math.min(evt.clientY, canvasHeight), 0)

            var deltaX = newX - point[0]
            var deltaY = newY - point[1]
            point[0] = newX
            point[1] = newY
            var middleX  = (curve.point1[0] + curve.point2[0])/2
            var middleY  = (curve.point1[1] + curve.point2[1])/2

            if (pointType == PointType.ControlPoint1) {
                curve.controlPoint2[0] = middleX - (newX - middleX)
                curve.controlPoint2[1] = middleY - (newY - middleY)
            }
            else if (pointType == PointType.ControlPoint2) {
                curve.controlPoint1[0] = middleX - (newX - middleX)
                curve.controlPoint1[1] = middleY - (newY - middleY)
            }
            else {
                // Moved endpoints, update control points
                curve.controlPoint1[0] += deltaX
                curve.controlPoint1[1] += deltaY
                curve.controlPoint2[0] += deltaX
                curve.controlPoint2[1] += deltaY
            }

            render()
        }

        document.addEventListener("mousemove", updateControlPoint)

        document.addEventListener("mouseup", function(evt) {
            draggedControlPoint = null;
            document.removeEventListener("mousemove", updateControlPoint);
            render()
        })

        return true
    }

    canvas.addEventListener("mousedown", function(evt) {
        var x = evt.clientX
        var y = evt.clientY

        if (evt.button == 1)
        {
            var p1 = curves[curves.length - 1].point2
            var p2 = [x, y]
            curves.push(createCurve(p1, p2, [p1[0] + 10, p1[1] + 10], [x + 10, y + 10]))
            render()
            return
        }

        for (var i = 0; i < curves.length; ++i) {
            var curve = curves[i]

            if (tryDragPoint(x, y, curve, PointType.ControlPoint1))
                return

            if (tryDragPoint(x, y, curve, PointType.ControlPoint2))
                return

            if (tryDragPoint(x, y, curve, PointType.Point1))
                return

            if (tryDragPoint(x, y, curve, PointType.Point2))
                return
        }
    }, false)

    function calculateBezierPoint(t, point1, point2, controlPoint1, controlPoint2) {
        var tInv = 1.0 - t
        var tInv2 = tInv * tInv
        var tInv3 = tInv * tInv * tInv
        var t2 = t * t
        var t3 = t * t * t
        var x = point1[0] * tInv3 + controlPoint1[0] * 3 * tInv2 * t + controlPoint2[0] * 3 * tInv * t2 + point2[0] * t3
        var y = point1[1] * tInv3 + controlPoint1[1] * 3 * tInv2 * t + controlPoint2[1] * 3 * tInv * t2 + point2[1] * t3
        return [x, y]
    }

    function drawHandle(point) {
        for (var x = point[0] - 3; x < point[0] + 3; ++x) {
            for (var y = point[1] - 3; y < point[1] + 3; ++y) {
                if (draggedControlPoint != null && draggedControlPoint == point)
                    drawPixel(x, y, 200, 0, 255, 255)
                else
                    drawPixel(x, y, 255, 200, 0, 255)
            }
        }
    }

    function render() {
        clearCanvas()

        for (var i = 0; i < curves.length; ++i) {
            var t = 0.0
            var curve = curves[i]

            while (t <= 1.0) {
                var point = calculateBezierPoint(t, curve.point1, curve.point2, curve.controlPoint1, curve.controlPoint2)
                drawPixel(point[0], point[1], 200, 200, 255, 255)
                t += 1.0/canvasWidth
            }

            drawHandle(curve.point1)
            drawHandle(curve.point2)
            drawHandle(curve.controlPoint1)
            drawHandle(curve.controlPoint2)
        }

        updateCanvas()
    }
    
    render()
}