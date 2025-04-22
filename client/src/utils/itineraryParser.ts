// Define the interface structure for our parsed data
interface SubSubSubSection {
  title: string;
  content: string[];
  bulletPoints: string[];
}

interface SubSubSection {
  title: string;
  content: string[];
  subSections: SubSubSubSection[];
  bulletPoints: string[];
}

interface SubSection {
  title: string;
  content: string[];
  subSections: SubSubSection[];
  bulletPoints: string[];
}

interface Section {
  title: string;
  content: string[];
  subSections: SubSection[];
  icon?: React.ReactNode;
  bulletPoints: string[];
}

/**
 * Parses the raw itinerary response into a structured format
 * @param rawResponse - The raw text of the itinerary from the API
 * @returns An array of structured sections with proper hierarchy
 */
const parseItineraryData = (rawResponse: string): Section[] => {
  // Split by section dividers (---)
  const rawSections = rawResponse
    .split("---")
    .filter((section) => section.trim() !== "");

  const parsedSections: Section[] = [];

  // Process each major section (separated by ---)
  for (const rawSection of rawSections) {
    const lines = rawSection.trim().split("\n");
    let currentSection: Section | null = null;
    let currentSubSection: SubSection | null = null;
    let currentSubSubSection: SubSubSection | null = null;
    let currentSubSubSubSection: SubSubSubSection | null = null;

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) continue;

      // Main section ($$$$)
      if (line.startsWith("$$$$")) {
        // Create new main section
        currentSection = {
          title: line.replace("$$$$", "").replace(/\*\*$/, "").trim(),
          content: [],
          subSections: [],
          bulletPoints: [],
        };
        parsedSections.push(currentSection);

        // Reset all sub-section pointers
        currentSubSection = null;
        currentSubSubSection = null;
        currentSubSubSubSection = null;
      }
      // Sub-section ($$$)
      else if (line.startsWith("$$$")) {
        if (!currentSection) {
          // If no current section exists, create a default one
          currentSection = {
            title: "Untitled Section",
            content: [],
            subSections: [],
            bulletPoints: [],
          };
          parsedSections.push(currentSection);
        }

        // Create new sub-section
        currentSubSection = {
          title: line.replace("$$$", "").replace(/\*$/, "").trim(),
          content: [],
          subSections: [],
          bulletPoints: [],
        };
        currentSection.subSections.push(currentSubSection);

        // Reset lower level pointers
        currentSubSubSection = null;
        currentSubSubSubSection = null;
      }
      // Sub-sub-section ($$)
      else if (line.startsWith("$$") && !line.startsWith("$$$")) {
        if (!currentSubSection) {
          // If there's a section but no subsection, add this content to the section
          if (currentSection) {
            currentSection.content.push(line);
          }
          continue;
        }

        // Create new sub-sub-section
        currentSubSubSection = {
          title: line.replace("$$", "").replace(/\*$/, "").trim(),
          content: [],
          subSections: [],
          bulletPoints: [],
        };
        currentSubSection.subSections.push(currentSubSubSection);

        // Reset lowest level pointer
        currentSubSubSubSection = null;
      }
      // Sub-sub-sub-section ($)
      else if (line.startsWith("$") && !line.startsWith("$$")) {
        if (!currentSubSubSection) {
          // If there's a subsection but no sub-sub-section, add this content to the subsection
          if (currentSubSection) {
            currentSubSection.content.push(line);
          }
          continue;
        }

        // Create new sub-sub-sub-section
        currentSubSubSubSection = {
          title: line.replace("$", "").replace(/\*$/, "").trim(),
          content: [],
          bulletPoints: [],
        };
        currentSubSubSection.subSections.push(currentSubSubSubSection);
      }
      // Bullet points (lines starting with * or -)
      else if (line.startsWith("*") || line.startsWith("-")) {
        const bulletPoint = line.replace(/^[*-]\s*/, "").trim();

        // Add bullet point to the appropriate section level
        if (currentSubSubSubSection) {
          currentSubSubSubSection.bulletPoints.push(bulletPoint);
        } else if (currentSubSubSection) {
          currentSubSubSection.bulletPoints.push(bulletPoint);
        } else if (currentSubSection) {
          currentSubSection.bulletPoints.push(bulletPoint);
        } else if (currentSection) {
          currentSection.bulletPoints.push(bulletPoint);
        }
      }
      // Regular content
      else {
        // Add content to the appropriate section level
        if (currentSubSubSubSection) {
          currentSubSubSubSection.content.push(line);
        } else if (currentSubSubSection) {
          currentSubSubSection.content.push(line);
        } else if (currentSubSection) {
          currentSubSection.content.push(line);
        } else if (currentSection) {
          currentSection.content.push(line);
        }
      }
    }

    // Assign icons to sections based on their titles
    if (currentSection) {
      const title = currentSection.title.toLowerCase();
      if (title.includes("travel guide")) {
        currentSection.icon = "LocationIcon";
      } else if (title.includes("itinerary")) {
        currentSection.icon = "HotelIcon";
      } else if (title.includes("highlights")) {
        currentSection.icon = "TipsIcon";
      } else {
        currentSection.icon = "InfoIcon";
      }
    }
  }

  return parsedSections;
};

// Format function to convert parsed data to string for display or debugging
const formatParsedData = (parsedData: Section[]): string => {
  let result = "";

  for (const section of parsedData) {
    result += `SECTION: ${section.title}\n`;
    result += `CONTENT: ${section.content.join("\n")}\n`;
    result += `BULLET POINTS: ${section.bulletPoints.join(", ")}\n`;

    for (const subSection of section.subSections) {
      result += `  SUB-SECTION: ${subSection.title}\n`;
      result += `  CONTENT: ${subSection.content.join("\n")}\n`;
      result += `  BULLET POINTS: ${subSection.bulletPoints.join(", ")}\n`;

      for (const subSubSection of subSection.subSections) {
        result += `    SUB-SUB-SECTION: ${subSubSection.title}\n`;
        result += `    CONTENT: ${subSubSection.content.join("\n")}\n`;
        result += `    BULLET POINTS: ${subSubSection.bulletPoints.join(
          ", "
        )}\n`;

        for (const subSubSubSection of subSubSection.subSections) {
          result += `      SUB-SUB-SUB-SECTION: ${subSubSubSection.title}\n`;
          result += `      CONTENT: ${subSubSubSection.content.join("\n")}\n`;
          result += `      BULLET POINTS: ${subSubSubSection.bulletPoints.join(
            ", "
          )}\n`;
        }
      }
    }

    result += "---\n";
  }

  return result;
};

export { parseItineraryData, formatParsedData };
