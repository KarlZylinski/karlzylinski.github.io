var items = {
    "Book: Introduction to Space Dynamics": [
        "x1. Introduction",
        "2. Kinematics",
        "3. Transformation of Coordinates",
        "4. Particle Dynamics (Satellite Orbits)",
        "5. Gyrodynamics",
        "6. Dynamics of Gyroscopic Instruments",
        "7. Space Vehicle Motion",
        "8. Performance and Optimization",
        "9. Generalized Theories of Mechanics"
    ],
    "Simulation Project: Rocket takeoff and orbital maneuvers": 0,
    "Book: Calculus": [
        "10. Parametric Equations and Polar Coordinates",
        "11. Vectors and the Geometry of Space",
        "12. Vector Functions",
        "15. Multiple Integrals",
        "16. Vector Calculus"
    ],
    "Book: Fundamentals of Astrodynamics": [
        "1. Two-Body Orbital Mechanics",
        "2. Orbit Determination from Observations",
        "3. Basic Orbital Maneuvers",
        "4. Position and Velocity as a Function of Time",
        "5. Orbit Determination from Two Positions and Time",
        "6. Ballistic Missile Trajectories",
        "7. Lunar Trajectories",
        "8. Interplanetary Trajectories",
        "9. Perturbations"
    ],
    "Simulation Project: Rocket takeoff and landing on other planet": 0,
    "Book: Spacecraft Attitude Dynamics": [
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
    ],
    "Simulation Project: Rocket takeoff and docking with station in orbit": 0,
    "Book: Space Propulsion Analysis and Design": [
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
    ],
    "Simulation Project: Send rocket with properly simulated internals into orbit": 0
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
        var progress = 0;
        var details = null;

        if (typeof item == "object")
        {
            var num_sub_items = item.length;
            var num_done_items = 0;

            details = document.createElement("div");
            details.classList.add("details");

            for (var i = 0; i < num_sub_items; ++i)
            {
                var detail_span = document.createElement("span");

                if (item[i][0] == "x")
                {
                    ++num_done_items;
                    detail_span.textContent = item[i].substring(1);
                    detail_span.style.textDecoration = "line-through";
                }
                else
                    detail_span.textContent = item[i];

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
            progress = item;
            total_items += 10;
            total_done_items += item / 10;
        }

        var container = document.createElement("div");
        container.classList.add("bar-container");
        var heading = document.createElement("h3");
        heading.textContent = name;
        var new_bar = document.createElement("div");
        new_bar.classList.add("bar");
        var new_meter = document.createElement("div");
        new_meter.classList.add("meter");
        new_bar.appendChild(new_meter);
        new_meter.style.width = progress + "%";
        container.appendChild(heading);
        container.appendChild(new_bar);

        if (details != null)
        {
            function toggle_details() {
                var new_bar_details = this.parentNode.querySelector(".details");
                new_bar_details.style.display = new_bar_details.style.display == "none" ? "block" : "none";
            }
            new_bar.addEventListener("click", toggle_details, false);
            heading.addEventListener("click", toggle_details, false);
            new_bar.style.cursor = "pointer";
            heading.style.cursor = "pointer";
            container.appendChild(details);
        }

        progress_per_item_container.appendChild(container);
    }

    overall_meter.style.width = (total_done_items / total_items) * 100 + "%";
};

