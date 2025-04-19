"use client";
// import { console } from "inspector";
import Image from "next/image";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { itineraryAPI } from "@/utils/api";
import { FiArrowLeft } from "react-icons/fi";

// import html2pdf from "html2pdf.js";
// import dynamic from "next/dynamic";

// Interface definitions for our data structure
interface ItineraryPreferences {
  cuisines: string[];
  placeTypes: string[];
  specialRequirements: string[];
  otherInterests: string[];
}

interface Itinerary {
  preferences: ItineraryPreferences;
  _id: string;
  userId: string;
  chatId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: any[];
  rawResponse: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ItineraryResponse {
  itinerary: Itinerary;
}

interface Section {
  title: string;
  content: string;
  icon: React.ReactNode;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const TravelItinerary = ({ params }: PageProps) => {
  const [itineraryData, setItineraryData] = useState<ItineraryResponse | null>(
    null
  );
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  // const [loading1, setLoading1] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        setIsLoading(true);
        const response = await itineraryAPI.getItineraryById(id);
        // const data = await response.json();
        // setItineraryData(data);
        setItineraryData(response);
      } catch (err) {
        console.error("Error fetching itinerary:", err);
        setError("Failed to load itinerary details");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && id) {
      fetchItinerary();
    }
  }, [isAuthenticated, id]);

  // Parse the raw response into structured sections
  const parseRawResponse = (rawResponse: string): Section[] => {
    // Split by section dividers (---)
    const rawSections = rawResponse
      .split("---")
      .filter((section) => section.trim() !== "");

    return rawSections.map((section) => {
      const lines = section.trim().split("\n");
      let title = "";
      let content = [];

      // Extract the title (usually starts with ### or similar)
      if (lines[0].includes("###")) {
        title = lines[0].replace(/#+\s*\*\*(.*)\*\*/, "$1").trim();
        content = lines.slice(1);
      } else {
        content = lines;
      }

      // Assign appropriate icon based on section title
      let icon;
      if (title.toLowerCase().includes("time to visit")) {
        icon = <CalendarIcon />;
      } else if (title.toLowerCase().includes("how to reach")) {
        icon = <TransportIcon />;
      } else if (title.toLowerCase().includes("places to visit")) {
        icon = <LocationIcon />;
      } else if (title.toLowerCase().includes("things to do")) {
        icon = <ActivityIcon />;
      } else if (title.toLowerCase().includes("where to stay")) {
        icon = <HotelIcon />;
      } else if (title.toLowerCase().includes("where to eat")) {
        icon = <FoodIcon />;
      } else if (title.toLowerCase().includes("travel tips")) {
        icon = <TipsIcon />;
      } else {
        icon = <InfoIcon />;
      }

      return {
        title,
        content: content.join("\n"),
        icon,
      };
    });
  };

  // console.log("parsed sections", parseRawResponse(itineraryData?.itinerary.rawResponse));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading your travel itinerary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto my-8 bg-red-50 p-6 rounded-lg text-red-500 shadow">
        <div className="flex items-center">
          <ErrorIcon />
          <p className="ml-2 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          </div>
          <p className="text-gray-600">Loading itinerary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <Link
            href="/itineraries"
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Back to Itineraries
          </Link>
        </div>
      </div>
    );
  }

  if (!itineraryData) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-gray-500 text-lg mb-4">Itinerary not found</div>
          <Link
            href="/itineraries"
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Back to Itineraries
          </Link>
        </div>
      </div>
    );
  }

  if (!itineraryData) {
    return <div>No itinerary data available.</div>;
  }

  const { itinerary } = itineraryData;
  const sections = parseRawResponse(itinerary.rawResponse);
  console.log("sections", sections);

  const handlePrintPDF = async () => {
    const html2pdfModule = await import("html2pdf.js");
    const html2pdf = html2pdfModule.default;
    try {
      // Create a new div element that will contain our printable content
      const printContent = document.createElement("div");
      printContent.style.padding = "20px";
      printContent.style.fontFamily = "Arial, sans-serif";
      printContent.style.maxWidth = "800px";
      printContent.style.margin = "0 auto";

      // Add title
      const title = document.createElement("h1");
      title.textContent = `${itinerary.destination} Travel Itinerary`;
      title.style.textAlign = "center";
      title.style.color = "#4169E1";
      title.style.borderBottom = "2px solid #4169E1";
      title.style.paddingBottom = "10px";
      printContent.appendChild(title);

      // Add dates
      const dates = document.createElement("p");
      dates.textContent = `${new Date(
        itinerary.startDate
      ).toLocaleDateString()} - ${new Date(
        itinerary.endDate
      ).toLocaleDateString()}`;
      dates.style.textAlign = "center";
      dates.style.fontWeight = "bold";
      dates.style.marginBottom = "20px";
      printContent.appendChild(dates);

      // Process each section
      sections.forEach((section) => {
        // Create section header
        const sectionTitle = document.createElement("h2");
        sectionTitle.textContent = section.title;
        sectionTitle.style.color = "#4169E1";
        sectionTitle.style.borderBottom = "1px solid #ddd";
        sectionTitle.style.paddingBottom = "5px";
        sectionTitle.style.marginTop = "25px";
        printContent.appendChild(sectionTitle);

        // Process content
        const contentLines = section.content.split("\n");

        contentLines.forEach((line) => {
          if (!line.trim()) {
            // Empty line - add spacing
            const spacer = document.createElement("div");
            spacer.style.height = "10px";
            printContent.appendChild(spacer);
            return;
          }

          // Sub-bullet points (indented bullet points)
          if (line.trim().match(/^\s+[-*]\s/)) {
            const item = document.createElement("div");
            item.style.marginLeft = "40px";
            item.style.display = "flex";
            item.style.marginBottom = "5px";

            const bullet = document.createElement("span");
            bullet.innerHTML = "&#8226; ";
            bullet.style.marginRight = "8px";
            bullet.style.color = "#4169E1";
            item.appendChild(bullet);

            const text = document.createElement("span");
            text.textContent = line.trim().replace(/^\s+[-*]\s*/, "");
            item.appendChild(text);

            printContent.appendChild(item);
          }
          // Special case for -** or *** starting (bold bullet points)
          else if (
            line.trim().startsWith("-**") ||
            line.trim().startsWith("***")
          ) {
            const item = document.createElement("div");
            item.style.marginLeft = "20px";
            item.style.display = "flex";
            item.style.marginBottom = "5px";

            const bullet = document.createElement("span");
            bullet.innerHTML = "&#8226; ";
            bullet.style.marginRight = "8px";
            bullet.style.color = "#4169E1";
            item.appendChild(bullet);

            const text = document.createElement("span");
            text.innerHTML = `<strong>${line
              .replace(/^[-*]\*\*\s*/, "")
              .replace(/\*\*/, "")}</strong>`;
            item.appendChild(text);

            printContent.appendChild(item);
          }
          // Regular bullet points
          else if (line.trim().startsWith("-") || line.trim().startsWith("*")) {
            const item = document.createElement("div");
            item.style.marginLeft = "20px";
            item.style.display = "flex";
            item.style.marginBottom = "5px";

            const bullet = document.createElement("span");
            bullet.innerHTML = "&#8226; ";
            bullet.style.marginRight = "8px";
            bullet.style.color = "#4169E1";
            item.appendChild(bullet);

            const text = document.createElement("span");
            text.textContent = line.replace(/^[-*]\s*/, "");
            item.appendChild(text);

            printContent.appendChild(item);
          }
          // Numbered list
          else if (/^\d+\./.test(line.trim())) {
            const [num, ...rest] = line.trim().split(".");

            const item = document.createElement("div");
            item.style.marginLeft = "20px";
            item.style.display = "flex";
            item.style.marginBottom = "5px";

            const number = document.createElement("span");
            number.textContent = `${num}. `;
            number.style.marginRight = "8px";
            number.style.fontWeight = "bold";
            number.style.color = "#4169E1";
            number.style.minWidth = "25px";
            item.appendChild(number);

            const text = document.createElement("span");
            text.textContent = rest.join(".").trim();
            item.appendChild(text);

            printContent.appendChild(item);
          }
          // Bold text handling
          else if (line.includes("**")) {
            const para = document.createElement("p");
            para.style.marginBottom = "10px";
            para.style.lineHeight = "1.5";

            let formattedText = line;
            // Replace ** markers with HTML strong tags
            formattedText = formattedText.replace(
              /\*\*(.*?)\*\*/g,
              "<strong>$1</strong>"
            );

            para.innerHTML = formattedText;
            printContent.appendChild(para);
          }
          // Regular text
          else {
            const para = document.createElement("p");
            para.textContent = line;
            para.style.marginBottom = "10px";
            para.style.lineHeight = "1.5";
            printContent.appendChild(para);
          }
        });
      });

      // Add a footer
      const footer = document.createElement("div");
      footer.style.marginTop = "30px";
      footer.style.borderTop = "1px solid #ddd";
      footer.style.paddingTop = "10px";
      footer.style.textAlign = "center";
      footer.style.fontSize = "12px";
      footer.style.color = "#777";
      footer.textContent = `Created on ${new Date().toLocaleDateString()}`;
      printContent.appendChild(footer);

      // Temporarily append to document
      document.body.appendChild(printContent);

      // Configure html2pdf options
      const options = {
        margin: 10,
        filename: `${itinerary.destination}_travel_itinerary.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      // Generate PDF
      html2pdf()
        .from(printContent)
        .set(options)
        .save()
        .then(() => {
          // Remove the temporary element after PDF is generated
          document.body.removeChild(printContent);
        });
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Card */}
        <div className="relative overflow-hidden bg-white rounded-xl shadow-lg mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-90"></div>
          <Image
            src="/images/travelImg.jpg"
            alt={itinerary.destination}
            layout="fill"
            objectFit="cover"
            className="mix-blend-overlay"
          />
          <div className="relative z-10 p-8 md:p-12 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <div className="flex items-center mb-4">
                  <Link
                    href="/itineraries"
                    className="flex items-center text-white hover:text-blue-100 transition-colors"
                  >
                    <FiArrowLeft className="mr-2" />
                    Back to Itineraries
                  </Link>
                </div>
                <div className="inline-flex items-center px-3 py-1  rounded-full bg-opacity-20 backdrop-blur-lg text-sm font-medium mb-4">
                  <span className="mr-2">✨</span>
                  <span>Travel Itinerary</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  {itinerary.destination}
                </h1>
                <div className="flex items-center mt-3">
                  <CalendarIcon small />
                  <span className="ml-2">
                    {new Date(itinerary.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    -{" "}
                    {new Date(itinerary.endDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Special Requirements */}
              {itinerary.preferences.specialRequirements.length > 0 && (
                <div className="mt-6 md:mt-0">
                  <div className="text-sm font-medium mb-2 opacity-80">
                    Special Requirements:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {itinerary.preferences.specialRequirements.map(
                      (req, index) => (
                        <span
                          key={index}
                          className=" bg-opacity-20 backdrop-blur-lg px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {req}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 p-1">
          <div className="flex overflow-x-auto hide-scrollbar">
            <button
              className={`flex-shrink-0 px-4 py-2 rounded-md font-medium text-sm ${
                activeTab === "overview"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            {sections.map((section, index) => (
              <button
                key={index}
                className={`flex-shrink-0 px-4 py-2 rounded-md font-medium text-sm ${
                  activeTab === `section-${index}`
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => setActiveTab(`section-${index}`)}
              >
                {/* {section.title} */}
                {section.title == "" ? "Let's Go!" : section.title}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {activeTab === "overview" ? (
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Trip Overview
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setActiveTab(`section-${index}`)}
                  >
                    <div className="flex items-center mb-4">
                      <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                        {section.icon}
                      </div>
                      <h3 className="ml-3 text-lg font-semibold text-gray-800">
                        {section.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 line-clamp-3">
                      {section.content.replace(/^[-*•]\s*/gm, "").slice(0, 120)}
                      ...
                    </p>
                    <div className="flex justify-end mt-4">
                      <span className="text-blue-600 font-medium text-sm flex items-center">
                        View Details
                        <ArrowRightIcon />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center mb-4">
                  <InfoIcon />
                  <h3 className="ml-2 text-lg font-semibold text-gray-800">
                    About This Itinerary
                  </h3>
                </div>
                <p className="text-gray-600">
                  This itinerary for {itinerary.destination} was created on{" "}
                  {new Date(itinerary.createdAt).toLocaleDateString()}. It
                  includes recommendations for activities, accommodations, and
                  travel tips to help you plan your trip.
                </p>
              </div>
            </div>
          ) : (
            sections.map(
              (section, index) =>
                activeTab === `section-${index}` && (
                  <div key={index} className="p-6 md:p-8">
                    <div className="flex items-center mb-6">
                      <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                        {section.icon}
                      </div>
                      <h2 className="ml-3 text-2xl font-bold text-gray-800">
                        {section.title}
                      </h2>
                    </div>

                    <div className="prose max-w-none">
                      {section.content.split("\n").map((line, lineIndex) => {
                        // Handle bullet points
                        if (
                          line.trim().startsWith("-") ||
                          line.trim().startsWith("*")
                        ) {
                          const text = line.replace(/^[-*]\s*/, "");
                          // Check for bold text in bullet points
                          if (text.includes("**")) {
                            const parts = text.split(/\*\*(.*?)\*\*/);
                            return (
                              <div
                                key={lineIndex}
                                className="flex items-start mb-3"
                              >
                                <div className="text-blue-500 mr-2 mt-1">•</div>
                                <div className="flex-1">
                                  {parts.map((part, partIndex) =>
                                    partIndex % 2 === 0 ? (
                                      <span key={partIndex}>{part}</span>
                                    ) : (
                                      <span
                                        key={partIndex}
                                        className="font-bold"
                                      >
                                        {part}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={lineIndex}
                              className="flex items-start mb-3"
                            >
                              <div className="text-blue-500 mr-2 mt-1">•</div>
                              <div className="flex-1">{text}</div>
                            </div>
                          );
                        }

                        // Handle numbered lists
                        if (/^\d+\./.test(line.trim())) {
                          const [num, ...rest] = line.trim().split(".");
                          const text = rest.join(".").trim();

                          // Check for bold text in numbered points
                          if (text.includes("**")) {
                            const parts = text.split(/\*\*(.*?)\*\*/);
                            return (
                              <div
                                key={lineIndex}
                                className="flex items-start mb-3"
                              >
                                <div className="text-blue-500 font-bold mr-2 w-5 text-center">
                                  {num}.
                                </div>
                                <div className="flex-1">
                                  {parts.map((part, partIndex) =>
                                    partIndex % 2 === 0 ? (
                                      <span key={partIndex}>{part}</span>
                                    ) : (
                                      <span
                                        key={partIndex}
                                        className="font-bold"
                                      >
                                        {part}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={lineIndex}
                              className="flex items-start mb-3"
                            >
                              <div className="text-blue-500 font-bold mr-2 w-5 text-center">
                                {num}.
                              </div>
                              <div className="flex-1">{text}</div>
                            </div>
                          );
                        }

                        // Regular paragraph with markdown bold text support
                        if (line.includes("**")) {
                          const parts = line.split(/\*\*(.*?)\*\*/);
                          return line.trim() === "" ? (
                            <div key={lineIndex} className="h-4"></div>
                          ) : (
                            <p key={lineIndex} className="mb-3">
                              {parts.map((part, partIndex) =>
                                partIndex % 2 === 0 ? (
                                  <span key={partIndex}>{part}</span>
                                ) : (
                                  <span key={partIndex} className="font-bold">
                                    {part}
                                  </span>
                                )
                              )}
                            </p>
                          );
                        }

                        // Regular paragraph
                        return line.trim() === "" ? (
                          <div key={lineIndex} className="h-4"></div>
                        ) : (
                          <p key={lineIndex} className="mb-3">
                            {line}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                )
            )
          )}
        </div>

        {/* Footer with print and share options */}
        <div className="mt-6 flex justify-between">
          <button
            className="bg-white rounded-lg shadow px-4 py-2 text-gray-600 hover:bg-gray-50 inline-flex items-center"
            onClick={handlePrintPDF}
          >
            <PrintIcon />
            <span className="ml-2">Download Itinerary</span>
          </button>

          <button className="bg-blue-600 rounded-lg shadow px-4 py-2 text-white hover:bg-blue-700 inline-flex items-center">
            <ShareIcon />
            <span className="ml-2">Share Itinerary</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Icon Components
const CalendarIcon = ({ small = false }) => (
  <svg
    className={small ? "w-4 h-4" : "w-6 h-6"}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const TransportIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
    />
  </svg>
);

const LocationIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const ActivityIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const HotelIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

const TipsIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  </svg>
);

const InfoIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ErrorIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const PrintIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
    />
  </svg>
);

const ShareIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    className="w-4 h-4 ml-1"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

const FoodIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

export default TravelItinerary;
