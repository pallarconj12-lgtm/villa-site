import Walkthrough from "@/components/walkthrough/Walkthrough";
import VillaDetails from "@/components/sections/VillaDetails";
import Experience from "@/components/sections/Experience";
import FloorPlan from "@/components/sections/FloorPlan";
import Gallery from "@/components/sections/Gallery";
import Location from "@/components/sections/Location";
import Booking from "@/components/sections/Booking";
import Footer from "@/components/layout/Footer";

/**
 * Page order follows the navigation. To move a section, just move its line.
 * CLICK → APPROACH → ENTER → WALK THROUGH → EXPLORE → STEP OUTSIDE → BOOK
 */
export default function Page() {
  return (
    <main>
      <Walkthrough />
      <VillaDetails />
      <Experience />
      <FloorPlan />
      <Gallery />
      <Location />
      <Booking />
      <Footer />
    </main>
  );
}
