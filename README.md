README: ARISE Barn Simulator v4.0
Project Overview
The ARISE (Advanced Regenerative Intensive System Environment) Barn Simulator is a digital twin modeling tool designed to validate the thermal and aerodynamic performance of a unique hurricane-proof poultry structure. This simulator focuses on the interaction between hydronic cooling, tunnel ventilation, and internal airflow management for meat chicken production in high-humidity tropical climates (Bahamas).
________________________________________
1. System Components
1.1 Structural Geometry
•	Form Factor: Arch-shaped tunnel (Category 4 Hurricane Proof).
•	Dimensions: 25' Wide x 100' Long.
•	Interior Height: 11'6" (3.5m) at the apex.
•	Shell Composition: 4" thick composite wall featuring smooth Fiberglass Reinforced Polymer (FRP) sections, 3" closed-cell spray foam, a Mylar reflective layer, a 1" thermal bridging air gap, and an exterior ceramic-coated zinc skin.
•	Interior Finish: Gel-coated smooth surface to promote laminar airflow and hygiene.
1.2 Ventilation & Airflow Management
•	Exhaust Fans: 4 to 6 high-capacity 48" cone fans on the rear wall.
•	Ceiling Baffles: Three fabric baffles spaced 33' apart, dropping 5' from the ceiling, cut to match the arch curvature. These concentrate airflow at the bird level.
•	HVLS Fans: Three 8' High-Volume Low-Speed fans on 4' center posts, used to destratify hot air from the upper arch and "dead zones" behind baffles.
•	Passive Intake: A 2' x 20' louvered opening at the front wall (7' elevation) for supplemental air and humidity control.
1.3 Hydronic Cooling System
•	Living Trellis: A 20' exterior arch trellis providing solar shading and initial evapotranspiration pre-cooling ($2\text{--}4^\circ\text{C}$ reduction).
•	Radiator Banks: Six 4' x 4' hydronic radiators in a V-gap formation, drawing water from an underground "thermal battery" (buried poly tanks).
•	Thermal Battery: Closed-loop recirculation system leveraging stable sub-surface ground temperatures.
________________________________________
2. Mathematical Engine
The simulator utilizes the following formulas to predict environmental outcomes within the structure:
2.1 Effective Cross-Sectional Area ($A_{eff}$)
To calculate wind-chill, we must find the area through which air is "squeezed" by the baffles.
•	Total Arch Area ($A_{total}$): Approximated for a parabolic arch:
$$A_{total} = \frac{2}{3} \times \text{Width} \times \text{Apex Height} \approx 192 \text{ sq. ft.}$$
•	Baffle Reduction Factor: Calculated based on the ratio of the open height ($H_{open}$) to total height ($H_{total}$):
$$A_{eff} = A_{total} \times \left( \frac{H_{total} - \text{Baffle Drop}}{H_{total}} \right)^{1.5}$$
2.2 Bird-Level Velocity (Wind-Chill)
Determines the convective cooling capacity experienced by the chickens:
$$V_{fpm} = \frac{\text{Total Fan CFM}}{A_{eff}}$$
•	Target: 600–800 fpm for maximum metabolic heat removal.
2.3 Sensible Heat Gain ($\Delta T$)
Calculates the temperature rise of the air as it travels from the intake to the exhaust fans due to bird metabolism:
$$\Delta T (^\circ\text{F}) = \frac{N_{birds} \times Q_{sensible}}{1.08 \times \text{Total CFM}}$$
•	$Q_{sensible}$: Average heat production per bird (approx. 35–45 BTU/hr for mature broilers).
2.4 Air Exchange Rate
The time required to replace 100% of the air volume in the barn:
$$\text{Exchange Time (sec)} = \frac{\text{Total Barn Volume (ft}^3\text{)}}{\text{Total CFM}} \times 60$$
2.5 Intake Static Pressure ($SP_{in}$)
Estimates the resistance the fans must overcome at the radiators:
$$SP_{in} = k \times \left( \frac{\text{Total CFM}}{\text{Intake Area}} \right)^2$$
•	$k$: Resistance coefficient derived from the radiator manufacturing spec (target $< 15$ Pa).
________________________________________
3. Visualization Logic
3.1 Longitudinal Side View
•	Laminar Flow: Visualized as a blue gradient. As the velocity increases (at baffle points), the color shifts from light to dark blue.
•	Dead Zones: Visualized in orange. These represent areas of low-velocity air ($< 50$ fpm) typically found immediately downwind of baffles or at the ridge apex.
•	HVLS Interaction: Shows vector arrows pushing stagnant orange air into the blue high-velocity stream.
3.2 Overhead Plan View
•	Thermal Distribution: Displays a heat map from the cool intake (left) to the warmer exhaust (right).
•	Stagnation Points: Highlights if the width of the arch creates corner pockets with insufficient air movement.
________________________________________
4. Operational Controls
The simulator allows for real-time manipulation of:
1.	Bird Population: Adjusts the total heat load and ammonia projection.
2.	Fan Staging: Toggles between 1 and 6 fans to see the impact on power efficiency vs. wind-chill.
3.	Baffle Depth: Demonstrates how "pinching" the air increases velocity without adding more fans.
4.	Passive Bypass: Shows how opening the top louver reduces intake pressure but bypasses the hydronic cooling effect.
________________________________________
5. Development & Deployment
The ARISE Simulator is built as a lightweight web application using:
•	HTML5/CSS3: UI Layout and styling.
•	JavaScript (ES6): Physics engine and state management.
•	Canvas API: Real-time 2D rendering of airflow vectors and heat maps.
