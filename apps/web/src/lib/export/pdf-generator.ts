import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface ExportOptions {
  includePricing: boolean;
  includeMap: boolean;
  includeActivities: boolean;
  includeNotes: boolean;
  timezone: string;
}

export async function generatePDF(
  tripData: any,
  itineraryData: any,
  options: ExportOptions
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  
  // Embed fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  let yPosition = height - 50;

  // Header
  page.drawText(tripData.title, {
    x: 50,
    y: yPosition,
    size: 24,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 30;

  // Date range
  const dateText = `${formatDate(tripData.startDate)} - ${formatDate(tripData.endDate)}`;
  page.drawText(dateText, {
    x: 50,
    y: yPosition,
    size: 12,
    font: helveticaFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  yPosition -= 20;

  // Destinations
  if (tripData.destinations?.length > 0) {
    const destinations = tripData.destinations.map((d: any) => `${d.city}, ${d.country}`).join(" • ");
    page.drawText(destinations, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    yPosition -= 20;
  }

  // Line separator
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  yPosition -= 30;

  // Trip Summary
  if (itineraryData.summary) {
    page.drawText("Trip Overview", {
      x: 50,
      y: yPosition,
      size: 16,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 25;

    // Break summary into lines to fit width
    const summaryLines = wrapText(itineraryData.summary, helveticaFont, 11, 495);
    for (const line of summaryLines) {
      if (yPosition < 100) {
        page = pdfDoc.addPage();
        yPosition = height - 50;
      }
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
    }
    yPosition -= 20;
  }

  // Daily Itinerary
  if (options.includeActivities && itineraryData.days) {
    if (yPosition < 150) {
      page = pdfDoc.addPage();
      yPosition = height - 50;
    }

    page.drawText("Daily Itinerary", {
      x: 50,
      y: yPosition,
      size: 16,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 30;

    for (const [dayIndex, day] of itineraryData.days.entries()) {
      if (yPosition < 150) {
        page = pdfDoc.addPage();
        yPosition = height - 50;
      }

      // Day header
      page.drawText(`Day ${dayIndex + 1} - ${formatDate(day.date)}`, {
        x: 50,
        y: yPosition,
        size: 14,
        font: helveticaBoldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 25;

      // Activities
      for (const activity of day.activities) {
        if (yPosition < 100) {
          page = pdfDoc.addPage();
          yPosition = height - 50;
        }

        // Time
        page.drawText(`${activity.timeSlot.start} - ${activity.timeSlot.end}`, {
          x: 70,
          y: yPosition,
          size: 11,
          font: helveticaBoldFont,
          color: rgb(0, 0, 0),
        });

        // Activity name
        page.drawText(activity.name, {
          x: 180,
          y: yPosition,
          size: 11,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;

        // Location
        if (activity.location?.name) {
          page.drawText(`Location: ${activity.location.name}`, {
            x: 180,
            y: yPosition,
            size: 10,
            font: helveticaFont,
            color: rgb(0.4, 0.4, 0.4),
          });
          yPosition -= 12;
        }

        // Description
        if (activity.description) {
          const descLines = wrapText(activity.description, helveticaFont, 10, 350);
          for (const line of descLines.slice(0, 2)) { // Limit to 2 lines
            page.drawText(line, {
              x: 180,
              y: yPosition,
              size: 10,
              font: helveticaFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPosition -= 12;
          }
        }

        // Cost
        if (options.includePricing && activity.cost?.amount > 0) {
          page.drawText(`Cost: ${activity.cost.currency} ${activity.cost.amount}`, {
            x: 180,
            y: yPosition,
            size: 10,
            font: helveticaBoldFont,
            color: rgb(0.15, 0.4, 0.9),
          });
          yPosition -= 12;
        }

        // Category and rating
        let metaInfo = [];
        if (activity.category) metaInfo.push(`Category: ${activity.category}`);
        if (activity.rating) metaInfo.push(`Rating: ${activity.rating}/5`);
        
        if (metaInfo.length > 0) {
          page.drawText(metaInfo.join(" • "), {
            x: 180,
            y: yPosition,
            size: 9,
            font: helveticaFont,
            color: rgb(0.4, 0.4, 0.4),
          });
          yPosition -= 12;
        }

        yPosition -= 10; // Extra spacing between activities
      }

      yPosition -= 20; // Extra spacing between days
    }
  }

  // Budget Summary
  if (options.includePricing) {
    if (yPosition < 200) {
      page = pdfDoc.addPage();
      yPosition = height - 50;
    }

    page.drawText("Budget Summary", {
      x: 50,
      y: yPosition,
      size: 16,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 30;

    const budgetSummary = calculateBudgetSummary(itineraryData);
    
    // Total cost
    page.drawText(`Total Estimated Cost: ${budgetSummary.currency} ${budgetSummary.total}`, {
      x: 70,
      y: yPosition,
      size: 12,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;

    // Category breakdown
    if (budgetSummary.byCategory && Object.keys(budgetSummary.byCategory).length > 0) {
      page.drawText("Cost by Category:", {
        x: 70,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;

      for (const [category, amount] of Object.entries(budgetSummary.byCategory)) {
        page.drawText(`• ${category}: ${budgetSummary.currency} ${amount}`, {
          x: 90,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 12;
      }
    }
  }

  // Add footer to all pages
  const pages = pdfDoc.getPages();
  pages.forEach((page, index) => {
    const footerText = `Generated by Tripthesia • ${new Date().toLocaleDateString()} • Page ${index + 1} of ${pages.length}`;
    page.drawText(footerText, {
      x: 50,
      y: 30,
      size: 8,
      font: helveticaFont,
      color: rgb(0.6, 0.6, 0.6),
    });
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    // Simple width estimation (not perfect but works for most cases)
    const estimatedWidth = testLine.length * fontSize * 0.6;
    
    if (estimatedWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word);
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function calculateBudgetSummary(itineraryData: any) {
  const summary = {
    total: 0,
    currency: itineraryData.currency || "USD",
    byCategory: {} as Record<string, number>,
  };

  if (!itineraryData.days) return summary;

  for (const day of itineraryData.days) {
    for (const activity of day.activities) {
      if (activity.cost?.amount > 0) {
        summary.total += activity.cost.amount;
        
        const category = activity.category || "Other";
        summary.byCategory[category] = (summary.byCategory[category] || 0) + activity.cost.amount;
      }
    }
  }

  return summary;
}