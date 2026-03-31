README: ARISE Barn Simulator v4.51
Project: Hydronic-Assisted Tunnel Ventilation System
Region: Bahamas / Tropical High-Humidity Zones
Developer: Greg Whiteside
Version: 4.51 (Revised March 2026)

Project Overview: The ARISE Barn Simulator is a digital twin modeling tool designed to validate the thermal and aerodynamic performance of a unique hurricane-proof poultry structure. This simulator focuses on the interaction between hydronic cooling, tunnel ventilation, and internal airflow management for meat chicken production in high-humidity tropical climates (Bahamas).

User Interaction Instructions
	Adjust Sliders: Move the environmental and mechanical sliders to observe real-time shifts in Exhaust levels and Viability Status.
	Toggle Passive Vent: Use the "OPEN/CLOSED" button to see how reducing static pressure increases air velocity and lowers ammonia levels.
	Point Probe: Click anywhere on the Side View or Overhead View canvas to see the specific conditions (Temp, NH3, Humidity) at that exact linear foot of the barn.

1. System Components
1.1 Structural Geometry: 
	Form Factor: Arch-shaped tunnel (Category 4 Hurricane Proof).
	Dimensions: 24' Wide x 100' Long.
	Exterior Height: 11'6” (3.5m) at the apex.
	Shell Composition: 4" thick composite wall featuring smooth Fiberglass Reinforced Polymer (FRP), closed-cell spray foam, and an exterior ceramic-coated galvanized skin.

1.2 Ventilation & Airflow Management: 
	Exhaust Fans: 1 to 6 high-capacity 48" cone fans on the rear wall.
	Ceiling Baffles: Adjustable fabric baffles that drop from the ceiling to concentrate airflow at the bird level.
	Passive Intake: A 2' x 20' louvered opening at the front wall for supplemental air and pressure relief.
	Pre-Cooling: Multi-stage exterior cooling via Camo Netting (-4°F) or a Living Trellis (-8°F).

1.3 Health & Biosecurity Indicators: 
	Viability Index: A real-time RED/GREEN/YELLOW status based on cumulative heat and ammonia stress.
	Point Probe: Interactive mapping that allows the user to click any X-coordinate to see localized environmental data.

2. Mathematical Engine: 
The simulator utilizes the following formulas to predict environmental outcomes:
2.1 Effective Airflow (\mathbit{Q}_{\mathbit{total}})
Calculates the total air volume adjusted for intake resistance. If the Passive Vent is CLOSED, system efficiency drops by 7% due to radiator drag.
(N_{fans}\times22,000)\times(0.93\mathrm{\ if\ Vent\ Closed,\ else\ }1.0)

2.2 Bird-Level Velocity (Wind-Chill)
Determines the speed of air moving over the chickens based on the "pinched" area (A_{eff}) created by baffles.
	Effective Area (\mathbit{A}_{\mathbit{eff}}):
192\times\left(\frac{11.5-\mathrm{Baffle\ Drop}}{11.5}\right)^{1.3}


	Velocity (\mathbit{V}_{\mathbit{fpm}}):
\frac{Q_{total}}{A_{eff}}

2.3 Sensible Heat Gain (\mathbf{\Delta}\mathbit{T})
Calculates the temperature rise as air travels from intake to exhaust due to bird metabolism.
\frac{N_{birds}\times45\mathrm{\ BTU/hr} }{1.08\times Q_{total}}

	Localized Temp at Point X:
T_{intake}+\left(\Delta T\times\frac{X}{100}\right)

2.4 Ammonia Accumulation (\mathbit{N}\mathbit{H}_\mathbf{3})
Predicts ppm levels based on bird density and air exchange rates.
\left(\frac{N_{birds}\times0.0005\mathrm{\ CFM/bird} }{Q_{total}}\right)\times1,000,000

2.5 Humidity Rise (\mathbit{RH})
Estimates the increase in moisture as air moves through the population.
\frac{N_{birds}\times0.01}{Q_{total}/1000}

3. Operational Thresholds (Health Status - Viability)
The simulator monitors the exhaust air to set the health status. The Chicken Viability Indicator uses the following logic to determine bird safety:
	STATUS: OPTIMAL (Green): Temperature is below 88°F AND Ammonia is below 15 ppm.
	STATUS: WARNING / STRESS (Yellow): Temperature is between 88°F–95°F OR Ammonia is between 15–25 ppm.
	STATUS: CRITICAL / LETHAL (Red): Temperature exceeds 95°F OR Ammonia exceeds 25 ppm.

4. Visualization Logic
	Side View: Displays wind-chill velocity and baffle "pinch points."
	Overhead View: A thermal heat map showing the "Cool-to-Warm" gradient and Ammonia spread.
	Interaction: Clicking on either map updates the "Point Probe" metrics in the sidebar.

5. Development & Deployment
	Language: JavaScript (ES6)
	Graphics: HTML5 Canvas API
	Styles: CSS3 with Flexbox-locked viewport.
