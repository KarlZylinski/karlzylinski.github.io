// Space Orbital Shizz by Karl Zylinski. Music by Karl Flodin.

var GEOMETRY_SIZE = 9
var TIME_SCALE = 1

var route = [
    {
        time: 2,
        action: "thrust"
    },
    {
        time: 4,
        action: "rotate",
        axis: "z",
        radsPerSec: 4
    },
    {
        time: 20,
        action: "stopRotate",
    },
    {
        time: 40,
        action: "cut"
    },
    {
        time: 500,
        action: "rotate",
        axis: "z",
        radsPerSec: 2
    },
    {
        time: 540,
        action: "stopRotate"
    },
    {
        time: 541,
        action: "thrust"
    },
    {
        time: 547,
        action: "cut"
    },/*,
    {
        time: 2330,
        action: "stopRotate"
    },
    {
        time: 2400,
        action: "thrust"
    },
    {
        time: 2440,
        action: "cut"
    },*/
]

IS_IOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);

window.onload = function()
{
    var simulationState = simulation.setup()
    var rendererState = renderer.setup()
    var inputState = input.setup()
    var startTime = new Date()
    var timeLastFrame = null
    TIME_SCALE = parseFloat(window.location.search.replace("?", "")) || 1

    if (TIME_SCALE > 1.0)
    {
        for (var i = 0; i < route.length; ++i)
            route[i].time += 10.0
    }

    var interval = setInterval(function() {
        var currentTime = new Date()

        var dt = timeLastFrame == null 
            ? 1
            : (currentTime - timeLastFrame)

        var timeSinceStart = (currentTime - startTime) / 1000.0
        var timeLastFrame = currentTime
        var time = timeSinceStart * TIME_SCALE

        if (dt === 0)
            dt = 1

        dt = dt / 1000.0
        var dtNonScaled = dt
        dt *= TIME_SCALE

            var inputThisFrame = clone(inputState)
            input.reset(inputState)
            simulation.simulate(simulationState, inputThisFrame, time, dt, dtNonScaled)
            rendererState.sunPos = entity.worldPosition(simulationState.sun)
            rendererState.playerPos = entity.worldPosition(simulationState.player)
            renderer.createAddedObjects(rendererState, simulationState.addedObjects)
            renderer.destroyRemovedObjects(rendererState, simulationState.removedObjects)
            simulationState.addedObjects = []
            simulationState.removedObjects = []
            renderer.draw(rendererState, time, simulationState.camera.view)

    }, 1000/30)
}

function clone(obj) {
    if (null == obj || "object" != typeof obj)
        return obj

    var copy = obj.constructor()

    for (var attr in obj)
    {
        if (obj.hasOwnProperty(attr))
            copy[attr] = obj[attr]
    }
    
    return copy
}

var input = {
    setup: function()
    {
        var state = {
            mousePosX: -1,
            mousePosY: -1,
            mouseDeltaX: 0,
            mouseDeltaY: 0,
            leftDown: false,
            rightDown: false,
            pressedKeys: {},
            releasedKeys: {},
            keysHeld: {}
        }

        document.addEventListener("mousemove", function(e) {
            var lastX = state.mousePosX
            var lastY = state.mousePosY
            state.mousePosX = e.pageX
            state.mousePosY = e.pageY

            if (!state.leftDown && !state.rightDown)
                return

            if (lastX != -1)
                state.mouseDeltaX += e.pageX - lastX

            if (lastY != -1)
                state.mouseDeltaY += e.pageY - lastY
        })

        document.addEventListener("mousedown", function(e) {
            if (e.button == 0)
                state.leftDown = true
            
            if (e.button == 2)
            {
                state.rightDown = true
                return false
            }
        })

        document.addEventListener("mouseup", function(e) {
            if (e.button == 0)
                state.leftDown = false
            
            if (e.button == 2)
            {
                state.rightDown = false
                return false
            }
        })

        document.addEventListener('keydown', function(e) {
            if(e.keyCode == 32)
            {
                state.keysHeld["space"] = true
                state.pressedKeys["space"] = true
            }

            if (e.keyCode == 38)
            {
                state.keysHeld["up"] = true
                state.pressedKeys["up"] = true
            }
        });

        document.addEventListener('keyup', function(e) {
            if(e.keyCode == 32)
            {
                state.keysHeld["space"] = false
                state.pressedKeys["space"] = false
            }

            if (e.keyCode == 38)
            {
                state.keysHeld["up"] = false
                state.pressedKeys["up"] = false
            }
        });

        return state
    },

    reset: function(state)
    {
        state.mouseDeltaX = 0
        state.mouseDeltaY = 0
        state.pressedKeys = {}
        state.releasedKeys = {}
    }
}

var simulation = {
    setup: function()
    {
        var state = {}
        state.world = []
        state.addedObjects = []
        state.removedObjects = []

        var origin = entity.spawn(state, null, 0, function(obj, dt, t) {
            entity.rotateY(obj, dt*0.01)
            entity.rotateZ(obj, dt*0.01)
        })

        var sunSize = 15000
        var planetSize = 2500
        var sunEnt = state.sun = entity.spawn(state, "sphere", sunSize)
        entity.setParent(sunEnt, origin)
        entity.translate(sunEnt, [0, sunSize*4, -sunSize*4])
        sunEnt.shader = "sun"
        sunEnt.color = [1, 0.9, 0]

        var sunHalo = entity.spawn(state, "sphere", sunSize + sunSize / 4)
        entity.setParent(sunHalo, sunEnt)
        sunHalo.shader = "halo"

        var planet = state.planet = entity.spawn(state, "sphere", planetSize)
        planet.shader = "planet"
        planet.color = [0.3, 0.8, 0.2]
        planet.mass = 100000000
        entity.rotateY(planet, 2)

        var moon = state.moon = entity.spawn(state, "sphere", planetSize / 2, function(obj, dt, t) {
            entity.rotateY(obj, dt*0.1)
        })

        moon.orbitParent = planet
        moon.velocity = [70.71, 0, -70.71]
        moon.mass = 1000
        entity.translate(moon, vec3.add(vec3.create(), entity.worldPosition(planet), [-planetSize*2.7, 0, -planetSize*2.7]))

        function getCoords(latNumber, longNumber)
        {
            var latitudeBands = longitudeBands = Math.min(100, 10 + planetSize)
            var theta = latNumber * Math.PI / latitudeBands
            var sinTheta = Math.sin(theta)
            var cosTheta = Math.cos(theta)

            var phi = longNumber * 2 * Math.PI / longitudeBands
            var sinPhi = Math.sin(phi)
            var cosPhi = Math.cos(phi)

            var x = cosPhi * sinTheta
            var y = cosTheta
            var z = sinPhi * sinTheta

            return [x, y, z]
        }

        var base = entity.spawn(state, "box", 0.7)
        base.shader = "pad"
        var rocketSize = 0.5
        state.player = entity.spawn(state, "rocket", rocketSize, function(obj, dt, t, input) {
            if ((input.pressedKeys["space"] || IS_IOS) && obj.started == false)
            {
                obj.started = true
                obj.thrust = false
                obj.rotate = false
                obj.rotateAxis = "y"
                obj.rotateRadsPerSec = 0
                obj.startTime = t
                obj.orbitParent = planet
                obj.thrusterParticles = []
                obj.lastThrusterParticleCreationTime = 0
                entity.calculateModel(obj)
            }

            if (obj.started && t > obj.startTime + 1)
            {
                var playerPosLen = vec3.length(obj.position)

                if (playerPosLen <= (planetSize))
                    TIME_SCALE = 0
            }

            if (obj.thrust)
            {
                var rMat = mat4.fromQuat(mat4.create(), obj.rotation)
                vec3.add(obj.velocity, obj.velocity, vec3.transformMat4(vec3.create(), [0, 1000 * dt, 0], rMat))

                function createParticle()
                {
                    var rX = Math.random()*Math.PI*2
                    var rY = Math.random()*Math.PI*2
                    var rZ = Math.random()*Math.PI*2
                    var mX = Math.random()*rocketSize*0.4 - rocketSize*0.2
                    var mZ = Math.random()*rocketSize*0.4 - rocketSize*0.2

                    var particle = entity.spawn(state, "triangle", rocketSize*0.25, function(obj, dt, t)
                    {
                        entity.rotateX(obj, dt*500)
                        entity.rotateY(obj, dt*500)
                        entity.rotateZ(obj, dt*500)
                        var scale = TIME_SCALE == 1.0 ? 1.0 : TIME_SCALE / 2.0
                        entity.translate(particle, [mX * dt * 200 / scale, -dt*100/scale, mZ * dt * 200 / scale])
                    })

                    entity.rotateX(particle, rX)
                    entity.rotateY(particle, rY)
                    entity.rotateZ(particle, rZ)
                    particle.shader = "particle"
                    entity.setParent(particle, obj.particleSpawnPoint)
                    return particle
                }

                if (t > obj.lastThrusterParticleCreationTime + 0.1)
                {
                    var numToCreate = (t - obj.lastThrusterParticleCreationTime) / 0.1

                    if (numToCreate < 1 || numToCreate > 5)
                        numToCreate = 1

                    for (var i = 0; i < numToCreate; ++i)
                    {
                        obj.thrusterParticles.push({
                            object: createParticle(),
                            createdAt: t
                        })
                    }
                    
                    obj.lastThrusterParticleCreationTime = t
                }
            }

            if (obj.thrusterParticles)
            {
                for (var i = 0; i < obj.thrusterParticles.length;)
                {
                    var p = obj.thrusterParticles[i]

                    if (t > p.createdAt + 0.5)
                    {
                        entity.despawn(state, p.object)
                        obj.thrusterParticles.splice(i, 1)
                    }
                    else
                        ++i
                }
            }

            if (obj.rotate)
            {
                if (obj.rotateAxis == "x")
                    entity.rotateX(obj, obj.rotateRadsPerSec * dt)

                if (obj.rotateAxis == "y")
                    entity.rotateY(obj, obj.rotateRadsPerSec * dt)

                if (obj.rotateAxis == "z")
                    entity.rotateZ(obj, obj.rotateRadsPerSec * dt)
            }

            if (obj.started)
            {
                if (route.length == 0)
                    return

                var action = route[0]

                if (t < obj.startTime + action.time)
                    return

                route.splice(0, 1)

                var a = action.action
                if (a == "thrust")
                    obj.thrust = true

                if (a == "cut")
                    obj.thrust = false

                if (a == "rotate")
                {
                    obj.rotate = true
                    obj.rotateAxis = action.axis
                    obj.rotateRadsPerSec = action.radsPerSec
                }

                if (a == "stopRotate")
                {
                    obj.rotate = false
                }
            }
        })

        state.player.particleSpawnPoint = entity.spawn(state, null, 0)
        entity.translate(state.player.particleSpawnPoint, [0, -(rocketSize + rocketSize * 0.25), 0])
        entity.setParent(state.player.particleSpawnPoint, state.player)
        state.player.mass = 20000
        state.player.started = false
        state.player.color = [0, 1, 1]
        state.player.shader = "ship"

        var planetNormPos = getCoords(0, 0)
        var offset = vec3.scale(vec3.create(), planetNormPos, planetSize + 0.7)
        entity.translate(base, vec3.subtract(vec3.create(), offset, [0, 0.95, 0]))

        var sky = entity.spawn(state, "box", 190000, function(obj) {
            obj.position = entity.worldPosition(state.player)
            entity.calculateModel(obj)
        })

        sky.shader = "sky"

        state.camera = entity.spawn(state, null, 0, function(obj, dt, t, input, dtNonScaled) {
            if (input.leftDown)
            {
                entity.rotateY(obj, -input.mouseDeltaX * dtNonScaled * 3)
                entity.rotateX(obj, -input.mouseDeltaY * dtNonScaled * 3)
            }
            
            if (input.rightDown)
                obj.distance += input.mouseDeltaY/50.0

            if (obj.distance < 1.2)
                obj.distance = 1.2

            entity.setPosition(obj, entity.worldPosition(state.player))
            var model = obj.model
            obj.view = mat4.invert(mat4.create(), mat4.translate(mat4.create(), model, [0, 0, obj.distance]))
        })

        entity.translate(state.player, offset)
        state.camera.view = mat4.create()
        state.camera.distance = 3
        return state
    },

    simulate: function(state, input, t, dt, dtNonScaled)
    {
        for (var i = 0; i < state.world.length; ++i)
        {
            var obj = state.world[i]

            if (obj.update)
                obj.update(obj, dt, t, input, dtNonScaled)

            if (vec3.length(obj.velocity) != 0)
            {
                if (obj.mass != 0 && obj.orbitParent && obj.orbitParent.mass != 0)
                {
                    var parent = obj.orbitParent
                    var v = vec3.subtract(vec3.create(), entity.worldPosition(parent), entity.worldPosition(obj))
                    var n = vec3.normalize(vec3.create(), v)
                    var d = vec3.length(v)
                    var G = 6.6726*Math.pow(10, -4)
                    var fDivM = (G * parent.mass * obj.mass) / (d*d)
                    var fv = vec3.scale(vec3.create(), n, fDivM * dt)
                    obj.velocity = vec3.add(vec3.create(), obj.velocity, fv)
                }

                entity.translate(obj, vec3.scale(vec3.create(), obj.velocity, dt))
            }
        }
    }
}

var entityIdCounter = 0

var entity = {
    spawn: function(simulationState, type, size, update)
    {
        var e = {
            id: entityIdCounter++,
            type: type,
            size: size,
            children: [],
            position: vec3.create(),
            rotation: quat.create(),
            model: mat4.create(),
            mass: 0,
            color: [1, 1, 1],
            velocity: [0, 0, 0],
            shader: "planet",
            update: update
        }

        simulationState.world.push(e)
        simulationState.addedObjects.push(e)
        entity.calculateModel(e)
        return e
    },

    despawn: function(simulationState, e)
    {
        var index = -1
        var world = simulationState.world

        for (var i = 0; i < simulationState.world.length; ++i)
        {
            if (world[i].id == e.id)
            {
                index = i
                break
            }
        }

        if (index == -1)
            return

        world.splice(index, 1)
        simulationState.removedObjects.push(e)
    },

    calculateModel: function(e)
    {
        function calculate(e)
        {
            var model = entity.localTransform(e)
        
            if (e.parent)
            {
                var parentTransform = calculate(e.parent)
                return mat4.multiply(mat4.create(), parentTransform, model)
            }

            return model
        }

        e.model = calculate(e)

        for (var i = 0; i < e.children.length; ++i) {
            entity.calculateModel(e.children[i])
        }
    },

    worldPosition: function(e)
    {
        var model = e.model
        return [model[12], model[13], model[14]]
    },

    localTransform: function(e)
    {
        return mat4.fromRotationTranslation(mat4.create(), e.rotation, e.position)
    },

    setPosition: function(e, vec)
    {
        e.position = vec
        entity.calculateModel(e)
    },

    translate: function(e, vec)
    {
        vec3.add(e.position, e.position, vec)
        entity.calculateModel(e)
    },

    rotateTo: function(e, a, b)
    {
        quat.rotationTo(e.rotation, a, b)
        entity.calculateModel(e)
    },

    rotateX: function(e, rads)
    {
        quat.rotateX(e.rotation, e.rotation, rads)
        entity.calculateModel(e)
    },

    rotateY: function(e, rads)
    {
        quat.rotateY(e.rotation, e.rotation, rads)
        entity.calculateModel(e)
    },

    rotateZ: function(e, rads)
    {
        quat.rotateZ(e.rotation, e.rotation, rads)
        entity.calculateModel(e)
    },

    setParent: function(e, parent)
    {
        parent.children.push(e)
        e.parent = parent
        entity.calculateModel(e)
    }
}

var renderer = {
    createGeometry: function(state, object)
    {
        function createSphere(radius)
        {
            var vertices = []
            var normals = []
            var latitudeBands = longitudeBands = Math.min(100, 10 + radius)

            function getCoords(latNumber, longNumber)
            {
                var theta = latNumber * Math.PI / latitudeBands
                var sinTheta = Math.sin(theta)
                var cosTheta = Math.cos(theta)

                var phi = longNumber * 2 * Math.PI / longitudeBands
                var sinPhi = Math.sin(phi)
                var cosPhi = Math.cos(phi)

                var x = cosPhi * sinTheta
                var y = cosTheta
                var z = sinPhi * sinTheta

                return { x: x, y: y, z: z }
            }

            function createSphereVertex(latNumber, longNumber)
            {
                var coords1 = getCoords(latNumber, longNumber)
                var coords2 = getCoords(latNumber + 1, longNumber)
                var coords3 = getCoords(latNumber, longNumber + 1)
                var coords4 = getCoords(latNumber + 1, longNumber)
                var coords5 = getCoords(latNumber + 1, longNumber + 1)
                var coords6 = getCoords(latNumber, longNumber + 1)

                vertices.push([coords1.x * radius, coords1.y * radius, coords1.z * radius])
                vertices.push([coords2.x * radius, coords2.y * radius, coords2.z * radius])
                vertices.push([coords3.x * radius, coords3.y * radius, coords3.z * radius])
                vertices.push([coords4.x * radius, coords4.y * radius, coords4.z * radius])
                vertices.push([coords5.x * radius, coords5.y * radius, coords5.z * radius])
                vertices.push([coords6.x * radius, coords6.y * radius, coords6.z * radius])

                normals.push([coords1.x, coords1.y, coords1.z])
                normals.push([coords2.x, coords2.y, coords2.z])
                normals.push([coords3.x, coords3.y, coords3.z])
                normals.push([coords4.x, coords4.y, coords4.z])
                normals.push([coords5.x, coords5.y, coords5.z])
                normals.push([coords6.x, coords6.y, coords6.z])
            }

            for (var latNumber = 0; latNumber <= latitudeBands; latNumber++)
            {
                for (var longNumber = 0; longNumber <= longitudeBands; longNumber++)
                {
                    createSphereVertex(latNumber, longNumber)
                }
            }

            return {
                vertices: vertices,
                normals: normals
            }
        }
        
        function createVertices(object)
        {
            var s = object.size
            var rw = 3.5
            var tw = 4
            var h = s/2
            switch(object.type)
            {
                case "triangle":
                    return {
                        vertices: [
                                [0, s/2, 0],
                                [s/2, 0, 0],
                                [-s/2, 0, 0]
                            ],
                        normals: [
                                [0, 0, -1],
                                [0, 0, -1],
                                [0, 0, -1]
                            ]
                        }

                case "sphere":
                    return createSphere(s)

                case "box":
                    return {
                        vertices: [
                                // Back
                                [h, h, -h],
                                [h, -h, -h],
                                [-h, -h, -h],
                                [-h, -h, -h],
                                [-h, h, -h],
                                [h, h, -h],

                                // Front
                                [h, h, h],
                                [h, -h, h],
                                [-h,-h, h],
                                [-h,-h, h],
                                [-h, h, h],
                                [h, h, h],

                                 // Right
                                [h, h, h],
                                [h, -h, h],
                                [h, -h, -h],
                                [h, -h, -h],
                                [h, h, -h],
                                [h, h, h],

                                 // Left
                                [-h, h, h],
                                [-h, -h, h],
                                [-h, -h, -h],
                                [-h, -h, -h],
                                [-h, h, -h],
                                [-h, h, h],

                                 // Top
                                [-h, h, -h],
                                [h, h, -h],
                                [-h, h, h],
                                [h, h, -h],
                                [h, h, h],
                                [-h, h, h],

                                 // Bottom
                                [-h, -h, -h],
                                [h, -h, -h],
                                [-h, -h, h],
                                [h, -h, -h],
                                [h, -h, h],
                                [-h, -h, h]
                            ],
                        normals: [
                                [0, 0, -1],
                                [0, 0, -1],
                                [0, 0, -1],
                                [0, 0, -1],
                                [0, 0, -1],
                                [0, 0, -1],
                                [0, 0, 1],
                                [0, 0, 1],
                                [0, 0, 1],
                                [0, 0, 1],
                                [0, 0, 1],
                                [0, 0, 1],
                                [1, 0, 0],
                                [1, 0, 0],
                                [1, 0, 0],
                                [1, 0, 0],
                                [1, 0, 0],
                                [1, 0, 0],
                                [-1, 0, 0],
                                [-1, 0, 0],
                                [-1, 0, 0],
                                [-1, 0, 0],
                                [-1, 0, 0],
                                [-1, 0, 0],
                                [0, 1, 0],
                                [0, 1, 0],
                                [0, 1, 0],
                                [0, 1, 0],
                                [0, 1, 0],
                                [0, 1, 0],
                                [0, -1, 0],
                                [0, -1, 0],
                                [0, -1, 0],
                                [0, -1, 0],
                                [0, -1, 0],
                                [0, -1, 0]
                            ]
                        }

                case "rocket":
                    return {
                        vertices: [
                            // Top front
                            [0, s/2, 0,],
                            [s/2, 0, s/2],
                            [-s/2, 0, s/2],

                            // Top right
                            [0, s/2, 0,],
                            [s/2, 0, -s/2],
                            [s/2, 0, s/2],

                            // Top back
                            [0, s/2, 0,],
                            [s/2, 0, -s/2],
                            [-s/2, 0, -s/2],

                            // Top left
                            [0, s/2, 0,],
                            [-s/2, 0, -s/2],
                            [-s/2, 0, s/2],

                            // Bottom
                            [-s/2, 0, s/2],
                            [s/2, 0, s/2],
                            [-s/2, 0, -s/2],
                            [s/2, 0, s/2],
                            [s/2, 0, -s/2],
                            [-s/2, 0, -s/2],

                            // Right side
                            [s/rw, 0, s/rw],
                            [s/rw, 0, -s/rw],
                            [s/rw, -s, -s/rw],
                            [s/rw, 0, s/rw],
                            [s/rw, -s, s/rw],
                            [s/rw, -s, -s/rw],

                            // Left side
                            [-s/rw, 0, s/rw],
                            [-s/rw, 0, -s/rw],
                            [-s/rw, -s, -s/rw],
                            [-s/rw, 0, s/rw],
                            [-s/rw, -s, s/rw],
                            [-s/rw, -s, -s/rw],

                            // Front side
                            [s/rw, 0, s/rw],
                            [-s/rw, 0, s/rw],
                            [-s/rw, -s, s/rw],
                            [s/rw, 0, s/rw],
                            [s/rw, -s, s/rw],
                            [-s/rw, -s, s/rw],

                            // Back side
                            [s/rw, 0, -s/rw],
                            [-s/rw, 0, -s/rw],
                            [-s/rw, -s, -s/rw],
                            [s/rw, 0, -s/rw],
                            [s/rw, -s, -s/rw],
                            [-s/rw, -s, -s/rw],

                            // Far bottom
                            [-s/rw, -s, s/rw],
                            [s/rw, -s, s/rw],
                            [-s/rw, -s, -s/rw],
                            [s/rw, -s, s/rw],
                            [s/rw, -s, -s/rw],
                            [-s/rw, -s, -s/rw],

                            // Thruster front
                            [0, -s+s/5, 0],
                            [s/tw, -s-s/rw, s/tw],
                            [-s/tw, -s-s/rw, s/tw],

                            // Thruster right
                            [0, -s+s/5, 0],
                            [s/tw, -s-s/rw, -s/tw],
                            [s/tw, -s-s/rw, s/tw],

                            // Thruster back
                            [0, -s+s/5, 0],
                            [s/tw, -s-s/rw, -s/tw],
                            [-s/tw, -s-s/rw, -s/tw],

                            // Thruster left
                            [0, -s+s/5, 0],
                            [-s/tw, -s-s/rw, -s/tw],
                            [-s/tw, -s-s/rw, s/tw]
                        ],
                    normals: [
                            [0, 0.5, 0.5],
                            [0, 0.5, 0.5], 
                            [0, 0.5, 0.5],
                            [0.5, 0.5, 0],
                            [0.5, 0.5, 0],
                            [0.5, 0.5, 0],
                            [0, 0.5, -0.5],
                            [0, 0.5, -0.5], 
                            [0, 0.5, -0.5],
                            [-0.5, 0.5, 0],
                            [-0.5, 0.5, 0],
                            [-0.5, 0.5, 0],
                            [0, -1.0, 0],
                            [0, -1.0, 0],
                            [0, -1.0, 0],
                            [0, -1.0, 0],
                            [0, -1.0, 0],
                            [0, -1.0, 0],
                            [1.0, 0, 0],
                            [1.0, 0, 0],
                            [1.0, 0, 0],
                            [1.0, 0, 0],
                            [1.0, 0, 0],
                            [1.0, 0, 0],
                            [-1.0, 0, 0],
                            [-1.0, 0, 0],
                            [-1.0, 0, 0],
                            [-1.0, 0, 0],
                            [-1.0, 0, 0],
                            [-1.0, 0, 0],
                            [0, 0, 1.0],
                            [0, 0, 1.0],
                            [0, 0, 1.0],
                            [0, 0, 1.0],
                            [0, 0, 1.0],
                            [0, 0, 1.0],
                            [0, 0, -1.0],
                            [0, 0, -1.0],
                            [0, 0, -1.0],
                            [0, 0, -1.0],
                            [0, 0, -1.0],
                            [0, 0, -1.0],
                            [0, -1.0, 0],
                            [0, -1.0, 0],
                            [0, -1.0, 0],
                            [0, -1.0, 0],
                            [0, -1.0, 0],
                            [0, -1.0, 0],
                            [0, 0.5, 0.5],
                            [0, 0.5, 0.5], 
                            [0, 0.5, 0.5],
                            [0.5, 0.5, 0],
                            [0.5, 0.5, 0],
                            [0.5, 0.5, 0],
                            [0, 0.5, -0.5],
                            [0, 0.5, -0.5], 
                            [0, 0.5, -0.5],
                            [-0.5, 0.5, 0],
                            [-0.5, 0.5, 0],
                            [-0.5, 0.5, 0]
                        ]
                    }

                default: console.error("Unknown object type.")
                    break
            }
        }

        function packVertices(geometry, color)
        {
            var transformedVertices = []

            for (var i = 0; i < geometry.vertices.length; i++)
            {
                transformedVertices.push.apply(transformedVertices, geometry.vertices[i])
                transformedVertices.push.apply(transformedVertices, geometry.normals[i])
                transformedVertices.push.apply(transformedVertices, color)
            }

            return transformedVertices
        }

        if (object.type == null)
            return null

        var vertices = createVertices(object)
        var transformedVertices = packVertices(vertices, object.color)
        var gl = state.gl
        var handle = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, handle)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(transformedVertices), gl.STATIC_DRAW)

        return {
            handle: handle,
            size: transformedVertices.length / GEOMETRY_SIZE
        }
    },

    setup: function()
    {
        var state = {}
        var canvas = document.createElement("canvas")
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        document.body.appendChild(canvas)
        var gl = canvas.getContext("experimental-webgl")
        state.resolutionX = canvas.width
        state.resolutionY = canvas.height
        state.world = []
        console.assert(gl, "Failed loading GL.")
        state.gl = gl
        var ext = initWebGLEW(gl)
        state.shaders = {}
        state.shaders.halo = renderer.loadShaderProgram(gl, "halo-vs", "halo-fs")
        state.shaders.sky = renderer.loadShaderProgram(gl, "sky-vs", "sky-fs")
        state.shaders.pad = renderer.loadShaderProgram(gl, "pad-vs", "pad-fs")
        state.shaders.sun = renderer.loadShaderProgram(gl, "sun-vs", "sun-fs")
        state.shaders.particle = renderer.loadShaderProgram(gl, "particle-vs", "particle-fs")
        state.shaders.ship = renderer.loadShaderProgram(gl, "ship-vs", "ship-fs")
        state.shaders.planet = renderer.loadShaderProgram(gl, "planet-vs", "planet-fs")
        gl.clearColor(0, 0, 0, 1.0)
        gl.enable(gl.DEPTH_TEST)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        return state
    },

    createAddedObjects: function(state, addedObjects)
    {
        for (var i = 0; i < addedObjects.length; ++i)
        {
            var obj = addedObjects[i]

            if (!obj.type)
                continue

            obj.geometry = renderer.createGeometry(state, obj)
            state.world.push(obj)
        }
    },

    destroyRemovedObjects: function(state, removedObjects)
    {
        var deletedIds = []

        for (var i = 0; i < removedObjects.length; ++i)
        {
            var obj = removedObjects[i]

            if (!obj.type)
                continue

            state.gl.deleteBuffer(obj.geometry.handle)
            deletedIds.push(obj.id)
        }

        if (deletedIds.length == 0)
            return

        for (var i = 0; i < state.world.length;)
        {
            var obj = state.world[i]

            function matches()
            {
                for (var j = 0; j < deletedIds.length; ++j)
                {
                    if (obj.id == deletedIds[j])
                        return true
                }

                return false
            }

            if (matches())
                state.world.splice(i, 1)
            else
                ++i
        }
    },

    draw: function(state, time, view)
    {
        var gl = state.gl
        gl.viewport(0, 0, state.resolutionX, state.resolutionY)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        var projection = mat4.create()
        mat4.perspective(projection, 45, state.resolutionX / state.resolutionY, 0.5, 2000000.0)

        function drawObject(object)
        {
            var model = object.model
            var modelInverseTranspose = mat4.clone(model)
            mat4.invert(modelInverseTranspose, modelInverseTranspose)
            var modelView = mat4.create()
            mat4.multiply(modelView, view, model)
            var shader = state.shaders[object.shader]
            gl.bindBuffer(gl.ARRAY_BUFFER, object.geometry.handle)
            gl.useProgram(shader)
            gl.enableVertexAttribArray(shader.positionAttribute)
            gl.vertexAttribPointer(shader.positionAttribute, 3, gl.FLOAT, false, GEOMETRY_SIZE * 4, 0)
            gl.enableVertexAttribArray(shader.normalAttribute)
            gl.vertexAttribPointer(shader.normalAttribute, 3, gl.FLOAT, false, GEOMETRY_SIZE * 4, 3 * 4)
            gl.enableVertexAttribArray(shader.colorAttribute)
            gl.vertexAttribPointer(shader.colorAttribute, 3, gl.FLOAT, false, GEOMETRY_SIZE * 4, 6 * 4)
            gl.uniform3fv(shader.sunPositionUniform, vec3.subtract(vec3.create(), entity.worldPosition(object), state.sunPos))
            gl.uniformMatrix4fv(shader.modelInverseTransposeUniform, false, modelInverseTranspose)
            gl.uniformMatrix4fv(shader.projectionUniform, false, projection)
            
            if (shader.playerPositionUniform != 0)
                gl.uniform3fv(shader.playerPositionUniform, state.playerPos)

            gl.uniformMatrix4fv(shader.modelUniform, false, model)
            gl.uniformMatrix4fv(shader.modelViewUniform, false, modelView)
            gl.uniform1f(shader.timeUniform, time)
            gl.drawArrays(gl.TRIANGLES, 0, object.geometry.size)
        }

        for (var i = 0; i < state.world.length; i++)
            drawObject(state.world[i])
    },

    loadShaderProgram: function(gl, vertexShaderName, fragmentShaderName)
    {
        function getShader(gl, name)
        {
            var shaderScript = document.getElementById(name)
            console.assert(shaderScript, "Failed loading shader width name " + name)

            var str = ""
            var k = shaderScript.firstChild

            while (k) {
                if (k.nodeType == 3)
                    str += k.textContent

                k = k.nextSibling
            }

            var typeMapping = {
                "x-shader/x-vertex": gl.VERTEX_SHADER,
                "x-shader/x-fragment": gl.FRAGMENT_SHADER
            }

            var shader = gl.createShader(typeMapping[shaderScript.type])
            gl.shaderSource(shader, str)
            gl.compileShader(shader)
            console.assert(gl.getShaderParameter(shader, gl.COMPILE_STATUS), "Failed compiling shader: " + gl.getShaderInfoLog(shader))
            return shader
        }

        var vertexShader = getShader(gl, vertexShaderName)
        var fragmentShader = getShader(gl, fragmentShaderName)
        shaderProgram = gl.createProgram()
        gl.attachShader(shaderProgram, vertexShader)
        gl.attachShader(shaderProgram, fragmentShader)
        gl.linkProgram(shaderProgram)
        console.assert(gl.getProgramParameter(shaderProgram, gl.LINK_STATUS), "Could not init shaders")
        shaderProgram.positionAttribute = gl.getAttribLocation(shaderProgram, "position")
        shaderProgram.normalAttribute = gl.getAttribLocation(shaderProgram, "normal")
        shaderProgram.colorAttribute = gl.getAttribLocation(shaderProgram, "color")
        shaderProgram.sunPositionUniform = gl.getUniformLocation(shaderProgram, "sunPosition")
        shaderProgram.modelInverseTransposeUniform = gl.getUniformLocation(shaderProgram, "modelInverseTranspose")
        shaderProgram.projectionUniform = gl.getUniformLocation(shaderProgram, "projection")
        shaderProgram.playerPositionUniform = gl.getUniformLocation(shaderProgram, "playerPos")
        shaderProgram.modelUniform = gl.getUniformLocation(shaderProgram, "model")
        shaderProgram.modelViewUniform = gl.getUniformLocation(shaderProgram, "modelView")
        shaderProgram.timeUniform = gl.getUniformLocation(shaderProgram, "time")
        return shaderProgram
    }
}

var webGlewStruct = new WeakMap()

function initWebGLEW(gl) {

    function baseName(extName) {
        return extName.replace(/^[A-Z]+_/, '')
    }

    var struct = webGlewStruct.get(gl)

    if(struct)
        return struct

    var extensions = {}
    var supported = gl.getSupportedExtensions()

    for(var i = 0; i < supported.length; ++i)
    {
        var extName = supported[i]
        
        //Skip MOZ_ extensions
        if(extName.indexOf('MOZ_') === 0)
          continue
        
        var ext = gl.getExtension(supported[i])

        if(!ext)
          continue
        
        while(true) {
          extensions[extName] = ext
          var base = baseName(extName)

          if(base === extName)
            break

          extName = base
        }
    }

    webGlewStruct.set(gl, extensions)
    return extensions
}
