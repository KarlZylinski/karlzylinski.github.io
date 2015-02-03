var items = {
    "Book: Introduction to Space Dynamics (Thomson)": {
        "description": "Covers the basics. I will study this as an introductory deep dive into the subject without minding the details too much. I want to spark ideas of interest in my head which I carry with me through the calculus and remaining literature.",
        "progress": [
            "x1. Introduction",
            "2. Kinematics",
            "3. Transformation of Coordinates",
            "4. Particle Dynamics (Satellite Orbits)",
            "5. Gyrodynamics",
            "6. Dynamics of Gyroscopic Instruments",
            "7. Space Vehicle Motion",
            "8. Performance and Optimization",
            "9. Generalized Theories of Mechanics"
        ]},
    "Simulation project: Rocket takeoff and orbital maneuvers": {
        "description": "A 3D application with simple but scale-correct geometry which simulates a takeoff into orbit. It will include maneuvers for extending and lessening the orbit. Might write it in JavsScript and put up here. We'll see.",
        "progress": 0
    },
    "Book: Calculus (Stewart)": {
        "description": "Having partly studied this book previously, I will now study the later chapters on polar coordinates, multiple integrals and vector calculus. By having the introductory book in my backpack, I will be able to recognize the really important bits with clear examples in mind.",
        "progress": [
            "10. Parametric Equations and Polar Coordinates",
            "11. Vectors and the Geometry of Space",
            "12. Vector Functions",
            "15. Multiple Integrals",
            "16. Vector Calculus"
        ]
    },
    "Book: Fundamentals of Astrodynamics (Bate, Mueller, White)": {
        "description": "Similar to the introductory book but with more focus on the interactions of stellar bodies and the trajectories of spacecrafts. Having the calculus fresh in mind, this will book will be studied in detail.",
        "progress": [
            "1. Two-Body Orbital Mechanics",
            "2. Orbit Determination from Observations",
            "3. Basic Orbital Maneuvers",
            "4. Position and Velocity as a Function of Time",
            "5. Orbit Determination from Two Positions and Time",
            "6. Ballistic Missile Trajectories",
            "7. Lunar Trajectories",
            "8. Interplanetary Trajectories",
            "9. Perturbations"
        ]
    },
    "Simulation project: Rocket takeoff and landing on the moon": {
        "description": "Will quite possibly change. Similarly to the first simulation project, this will be a 3D application simulating the takeoff of a spacecraft. This time however, I will have it land on the moon using my newly found knowledge in lunar trajectories and two-body orbital mechanics.",
        "progress": 0
    },
    "Book: Spacecraft Attitude Dynamics (Hughes)": {
        "description": "This book focuses on the exact movements required to stabilize and steer spacecrafts and satellites.",
        "progress": [
            "1. Introduction",
            "2. Rotational Kinematics",
            "3. Attitude Motions Equations",
            "4. Attitude Dynamics of a Rigid Body",
            "5. Effect of Internal Energy Dissipation on the Directional Stability of Spinning Bodies",
            "6. Directional Stability of Multispin Vehicles",
            "7. Effect of Internal Energy Dissipation on the Directional Stability of Gyrostats",
            "8. Spacecraft Torques",
            "9. Gravitational Stabilization",
            "10. Spin Stabilization in Orbit",
            "11. Dual-Stabilization in Orbit: Gyrostats and Bias Momentum Satellites"
        ]
    },
    "Simulation project: Rocket takeoff and docking with station in orbit": {
        "description": "Subject to change. In this simulation, I will just as the previous ones have a spaceship take off. Focus will this time around be on matching the orbital height, relative velocity and attitude of a space station, simulating a simple docking procedure.",
        "progress": 0
    },
    "Book: Space Propulsion Analysis and Design (Humble, Henry, Larson)": {
        "description": "Having read up on all that stuff about attitude, two-body problems, interplanetary trajectories etc is nice. But what actually makes the rockets go? I will by studying this book learn to design a rocket propulsion system.",
        "progress": [
            "1. Introduction to Space Propulsion",
            "2. Mission Analysis",
            "3. Thermodynamics of Fluid Flow",
            "4. Thermochemistry",
            "5. Liquid Rocket Propulsion Systems",
            "6. Hybrid Rocket Propulsion Systems",
            "7. Nuclear Rocket Propulsion Systems",
            "8. Electric Rocket Propulsion Systems",
            "9. Mission Design Case Study",
            "10. Advanced Propulsion Systems"
        ]
    },
    "Simulation project: Send rocket with properly simulated internals into orbit": {
        "description": "This one is very vague since it's so far off. But using the rocket propulsion design ideas from the previous book, I thought I might be able to create a simulation of a rocket with a somewhat properly simulated propulsion system.",
        "progress": 0
    }
};

window.onload = function()
{
    var overall_meter = document.querySelector("#overall .meter");
    var total_items = 0;
    var total_done_items = 0;
    var progress_per_item_container = document.querySelector("#progressperitem");

    for (var name in items) {
        if (!items.hasOwnProperty(name))
            continue;

        var item = items[name];
        var progress = item.progress;
        var details = null;

        if (typeof progress == "object")
        {
            var num_sub_items = progress.length;
            var num_done_items = 0;

            details = document.createElement("div");
            details.classList.add("details");

            for (var i = 0; i < num_sub_items; ++i)
            {
                var detail_span = document.createElement("span");

                if (progress[i][0] == "x")
                {
                    ++num_done_items;
                    detail_span.textContent = progress[i].substring(1);
                    detail_span.style.textDecoration = "line-through";
                }
                else
                    detail_span.textContent = progress[i];

                details.appendChild(detail_span);
                details.appendChild(document.createElement("br"));
                details.style.display = "none";
            }

            total_items += num_sub_items;
            total_done_items += num_done_items;
            progress = num_done_items == 0 ? 0 : (num_done_items / num_sub_items) * 100;
        }
        else
        {
            total_items += 10;
            total_done_items += progress / 10;
        }

        var container = document.createElement("div");
        container.classList.add("bar-container");
        var heading = document.createElement("h3");
        heading.textContent = name;
        var new_bar = document.createElement("div");
        new_bar.classList.add("bar");

        if (progress == 0)
        {
            new_bar.textContent = "Not yet started"
        }
        else
        {
            var new_meter = document.createElement("div");
            new_meter.classList.add("meter");
            new_bar.appendChild(new_meter);
            new_meter.style.width = progress + "%";
        }
        var description = document.createElement("p");
        description.textContent = item.description;
        description.classList.add("item-description")
        container.appendChild(heading);
        container.appendChild(new_bar);

        if (details != null)
        {
            function toggle_details() {
                var new_bar_details = this.parentNode.querySelector(".details");
                new_bar_details.style.display = new_bar_details.style.display == "none" ? "block" : "none";
            }
            new_bar.addEventListener("click", toggle_details, false);
            new_bar.style.cursor = "pointer";
            container.appendChild(details);
        }

        container.appendChild(description);
        progress_per_item_container.appendChild(container);
    }

    overall_meter.style.width = (total_done_items / total_items) * 100 + "%";
};

