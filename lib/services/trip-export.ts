/**
 * Trip Export Service - Phase 3.5
 * 
 * Comprehensive export functionality for trip data in multiple formats:
 * - GPX: GPS Exchange Format for routes and waypoints
 * - KML: Keyhole Markup Language for Google Earth and Maps
 * - PDF: Printable itinerary with detailed information
 * - ICS: Calendar format for importing events
 * - JSON: Full trip data export
 */

import { jsPDF } from 'jspdf';

// ==================== TYPES ====================

export interface TripData {
  id: string;
  title: string;
  description?: string;
  dates: {
    startDate: string;
    endDate: string;
    duration: number; // days
  };
  destinations: {
    origin: Location;
    destination: Location;
    waypoints?: Location[];
  };
  participants: {
    adults: number;
    children: number;
    names?: string[];
  };
  transportation: TransportationInfo[];
  accommodations: AccommodationInfo[];
  activities: ActivityInfo[];
  dining: DiningInfo[];
  route?: RouteInfo;
  budget?: BudgetInfo;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number]; // [longitude, latitude]
  type: 'city' | 'landmark' | 'hotel' | 'restaurant' | 'activity' | 'transport';
  visitTime?: string; // ISO datetime
  duration?: number; // minutes
  notes?: string;
}

export interface TransportationInfo {
  id: string;
  type: 'flight' | 'train' | 'bus' | 'car' | 'bike' | 'walk';
  provider: string;
  from: Location;
  to: Location;
  departure: string;
  arrival: string;
  duration: number; // minutes
  price?: {
    amount: number;
    currency: string;
  };
  bookingReference?: string;
  seats?: string[];
  notes?: string;
}

export interface AccommodationInfo {
  id: string;
  name: string;
  type: 'hotel' | 'apartment' | 'hostel' | 'resort' | 'villa';
  location: Location;
  checkIn: string;
  checkOut: string;
  nights: number;
  rooms: number;
  guests: number;
  price?: {
    amount: number;
    currency: string;
    perNight: number;
  };
  amenities: string[];
  bookingReference?: string;
  rating?: number;
  notes?: string;
}

export interface ActivityInfo {
  id: string;
  name: string;
  category: 'sightseeing' | 'adventure' | 'cultural' | 'dining' | 'shopping' | 'entertainment';
  location: Location;
  dateTime: string;
  duration: number; // minutes
  price?: {
    amount: number;
    currency: string;
    perPerson?: boolean;
  };
  description?: string;
  bookingRequired?: boolean;
  bookingReference?: string;
  notes?: string;
}

export interface DiningInfo {
  id: string;
  name: string;
  cuisine: string;
  location: Location;
  reservationTime?: string;
  partySize: number;
  priceRange: 'budget' | 'mid-range' | 'fine-dining';
  rating?: number;
  reservationReference?: string;
  dietary?: string[];
  notes?: string;
}

export interface RouteInfo {
  waypoints: Location[];
  totalDistance: number; // kilometers
  estimatedDuration: number; // minutes
  transportMode: 'driving' | 'walking' | 'cycling' | 'transit';
  optimized: boolean;
  costs?: {
    fuel?: number;
    tolls?: number;
    parking?: number;
    total: number;
    currency: string;
  };
}

export interface BudgetInfo {
  currency: string;
  total: number;
  breakdown: {
    transportation: number;
    accommodation: number;
    activities: number;
    dining: number;
    other: number;
  };
  perPerson: number;
}

export interface ExportOptions {
  format: 'gpx' | 'kml' | 'pdf' | 'ics' | 'json';
  includeRoute?: boolean;
  includeAccommodations?: boolean;
  includeActivities?: boolean;
  includeDining?: boolean;
  includeNotes?: boolean;
  language?: string;
  currency?: string;
  dateFormat?: string;
  customFields?: Record<string, any>;
}

export interface ExportResult {
  success: boolean;
  data?: string | ArrayBuffer;
  filename: string;
  mimeType: string;
  size: number;
  error?: string;
}

// ==================== MAIN SERVICE ====================

export class TripExportService {
  
  /**
   * Export trip data in the specified format
   */
  async exportTrip(tripData: TripData, options: ExportOptions): Promise<ExportResult> {
    try {
      switch (options.format) {
        case 'gpx':
          return await this.exportToGPX(tripData, options);
        case 'kml':
          return await this.exportToKML(tripData, options);
        case 'pdf':
          return await this.exportToPDF(tripData, options);
        case 'ics':
          return await this.exportToICS(tripData, options);
        case 'json':
          return await this.exportToJSON(tripData, options);
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      return {
        success: false,
        filename: '',
        mimeType: '',
        size: 0,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }

  /**
   * Export to GPX format (GPS Exchange Format)
   * Perfect for GPS devices and mapping applications
   */
  private async exportToGPX(tripData: TripData, options: ExportOptions): Promise<ExportResult> {
    const gpxData = this.generateGPX(tripData, options);
    const filename = `${this.sanitizeFilename(tripData.title)}_route.gpx`;
    
    return {
      success: true,
      data: gpxData,
      filename,
      mimeType: 'application/gpx+xml',
      size: new Blob([gpxData]).size
    };
  }

  /**
   * Export to KML format (Keyhole Markup Language)
   * Compatible with Google Earth and Google Maps
   */
  private async exportToKML(tripData: TripData, options: ExportOptions): Promise<ExportResult> {
    const kmlData = this.generateKML(tripData, options);
    const filename = `${this.sanitizeFilename(tripData.title)}_map.kml`;
    
    return {
      success: true,
      data: kmlData,
      filename,
      mimeType: 'application/vnd.google-earth.kml+xml',
      size: new Blob([kmlData]).size
    };
  }

  /**
   * Export to PDF format
   * Comprehensive printable itinerary
   */
  private async exportToPDF(tripData: TripData, options: ExportOptions): Promise<ExportResult> {
    const pdfData = await this.generatePDF(tripData, options);
    const filename = `${this.sanitizeFilename(tripData.title)}_itinerary.pdf`;
    
    return {
      success: true,
      data: pdfData,
      filename,
      mimeType: 'application/pdf',
      size: pdfData.byteLength
    };
  }

  /**
   * Export to ICS format (iCalendar)
   * For importing into calendar applications
   */
  private async exportToICS(tripData: TripData, options: ExportOptions): Promise<ExportResult> {
    const icsData = this.generateICS(tripData, options);
    const filename = `${this.sanitizeFilename(tripData.title)}_calendar.ics`;
    
    return {
      success: true,
      data: icsData,
      filename,
      mimeType: 'text/calendar',
      size: new Blob([icsData]).size
    };
  }

  /**
   * Export to JSON format
   * Full structured trip data
   */
  private async exportToJSON(tripData: TripData, options: ExportOptions): Promise<ExportResult> {
    const jsonData = this.generateJSON(tripData, options);
    const filename = `${this.sanitizeFilename(tripData.title)}_data.json`;
    
    return {
      success: true,
      data: jsonData,
      filename,
      mimeType: 'application/json',
      size: new Blob([jsonData]).size
    };
  }

  // ==================== GPX GENERATION ====================

  private generateGPX(tripData: TripData, options: ExportOptions): string {
    const waypoints = this.getAllWaypoints(tripData, options);
    
    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Tripthesia" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${this.escapeXml(tripData.title)}</name>
    <desc>${this.escapeXml(tripData.description || '')}</desc>
    <time>${tripData.createdAt}</time>
  </metadata>
`;

    // Add waypoints
    waypoints.forEach((point, index) => {
      gpx += `  <wpt lat="${point.coordinates[1]}" lon="${point.coordinates[0]}">
    <name>${this.escapeXml(point.name)}</name>
    <desc>${this.escapeXml(point.address)}</desc>
    <type>${point.type}</type>
  </wpt>
`;
    });

    // Add route if available and requested
    if (options.includeRoute && tripData.route && tripData.route.waypoints.length > 0) {
      gpx += `  <rte>
    <name>${this.escapeXml(tripData.title)} Route</name>
    <desc>Optimized route for trip</desc>
`;
      tripData.route.waypoints.forEach(point => {
        gpx += `    <rtept lat="${point.coordinates[1]}" lon="${point.coordinates[0]}">
      <name>${this.escapeXml(point.name)}</name>
    </rtept>
`;
      });
      gpx += `  </rte>
`;
    }

    gpx += `</gpx>`;
    return gpx;
  }

  // ==================== KML GENERATION ====================

  private generateKML(tripData: TripData, options: ExportOptions): string {
    const waypoints = this.getAllWaypoints(tripData, options);
    
    let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${this.escapeXml(tripData.title)}</name>
    <description>${this.escapeXml(tripData.description || '')}</description>
    
    <!-- Styles -->
    <Style id="hotel">
      <IconStyle>
        <Icon><href>http://maps.google.com/mapfiles/kml/shapes/lodging.png</href></Icon>
      </IconStyle>
    </Style>
    <Style id="restaurant">
      <IconStyle>
        <Icon><href>http://maps.google.com/mapfiles/kml/shapes/dining.png</href></Icon>
      </IconStyle>
    </Style>
    <Style id="activity">
      <IconStyle>
        <Icon><href>http://maps.google.com/mapfiles/kml/shapes/star.png</href></Icon>
      </IconStyle>
    </Style>
    <Style id="transport">
      <IconStyle>
        <Icon><href>http://maps.google.com/mapfiles/kml/shapes/airports.png</href></Icon>
      </IconStyle>
    </Style>
`;

    // Add folders for organization
    const folders = {
      accommodations: options.includeAccommodations && tripData.accommodations.length > 0,
      activities: options.includeActivities && tripData.activities.length > 0,
      dining: options.includeDining && tripData.dining.length > 0
    };

    if (folders.accommodations) {
      kml += `    <Folder>
      <name>Accommodations</name>
`;
      tripData.accommodations.forEach(hotel => {
        kml += `      <Placemark>
        <name>${this.escapeXml(hotel.name)}</name>
        <description><![CDATA[
          <b>Type:</b> ${hotel.type}<br/>
          <b>Check-in:</b> ${new Date(hotel.checkIn).toLocaleDateString()}<br/>
          <b>Check-out:</b> ${new Date(hotel.checkOut).toLocaleDateString()}<br/>
          <b>Nights:</b> ${hotel.nights}<br/>
          ${hotel.price ? `<b>Price:</b> ${hotel.price.currency} ${hotel.price.amount}<br/>` : ''}
          ${hotel.amenities.length > 0 ? `<b>Amenities:</b> ${hotel.amenities.join(', ')}<br/>` : ''}
          ${hotel.notes ? `<b>Notes:</b> ${hotel.notes}` : ''}
        ]]></description>
        <styleUrl>#hotel</styleUrl>
        <Point>
          <coordinates>${hotel.location.coordinates[0]},${hotel.location.coordinates[1]},0</coordinates>
        </Point>
      </Placemark>
`;
      });
      kml += `    </Folder>
`;
    }

    if (folders.activities) {
      kml += `    <Folder>
      <name>Activities</name>
`;
      tripData.activities.forEach(activity => {
        kml += `      <Placemark>
        <name>${this.escapeXml(activity.name)}</name>
        <description><![CDATA[
          <b>Category:</b> ${activity.category}<br/>
          <b>Date:</b> ${new Date(activity.dateTime).toLocaleString()}<br/>
          <b>Duration:</b> ${Math.floor(activity.duration / 60)}h ${activity.duration % 60}m<br/>
          ${activity.price ? `<b>Price:</b> ${activity.price.currency} ${activity.price.amount}${activity.price.perPerson ? ' per person' : ''}<br/>` : ''}
          ${activity.description ? `<b>Description:</b> ${activity.description}<br/>` : ''}
          ${activity.notes ? `<b>Notes:</b> ${activity.notes}` : ''}
        ]]></description>
        <styleUrl>#activity</styleUrl>
        <Point>
          <coordinates>${activity.location.coordinates[0]},${activity.location.coordinates[1]},0</coordinates>
        </Point>
      </Placemark>
`;
      });
      kml += `    </Folder>
`;
    }

    if (folders.dining) {
      kml += `    <Folder>
      <name>Dining</name>
`;
      tripData.dining.forEach(restaurant => {
        kml += `      <Placemark>
        <name>${this.escapeXml(restaurant.name)}</name>
        <description><![CDATA[
          <b>Cuisine:</b> ${restaurant.cuisine}<br/>
          <b>Price Range:</b> ${restaurant.priceRange}<br/>
          ${restaurant.reservationTime ? `<b>Reservation:</b> ${new Date(restaurant.reservationTime).toLocaleString()}<br/>` : ''}
          <b>Party Size:</b> ${restaurant.partySize}<br/>
          ${restaurant.rating ? `<b>Rating:</b> ${restaurant.rating}/5<br/>` : ''}
          ${restaurant.dietary?.length ? `<b>Dietary:</b> ${restaurant.dietary.join(', ')}<br/>` : ''}
          ${restaurant.notes ? `<b>Notes:</b> ${restaurant.notes}` : ''}
        ]]></description>
        <styleUrl>#restaurant</styleUrl>
        <Point>
          <coordinates>${restaurant.location.coordinates[0]},${restaurant.location.coordinates[1]},0</coordinates>
        </Point>
      </Placemark>
`;
      });
      kml += `    </Folder>
`;
    }

    // Add route line if available
    if (options.includeRoute && tripData.route && tripData.route.waypoints.length > 1) {
      kml += `    <Placemark>
      <name>Trip Route</name>
      <description>Optimized route for ${tripData.title}</description>
      <LineString>
        <coordinates>
`;
      tripData.route.waypoints.forEach(point => {
        kml += `          ${point.coordinates[0]},${point.coordinates[1]},0
`;
      });
      kml += `        </coordinates>
      </LineString>
    </Placemark>
`;
    }

    kml += `  </Document>
</kml>`;
    
    return kml;
  }

  // ==================== PDF GENERATION ====================

  private async generatePDF(tripData: TripData, options: ExportOptions): Promise<ArrayBuffer> {
    const doc = new jsPDF();
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const maxWidth = doc.internal.pageSize.width - (margin * 2);

    // Helper function to add new page if needed
    const checkPageBreak = (requiredHeight: number = 10) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(tripData.title, margin, yPosition);
    yPosition += 15;

    if (tripData.description) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(tripData.description, maxWidth);
      doc.text(descLines, margin, yPosition);
      yPosition += descLines.length * 5 + 10;
    }

    // Trip Overview
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Trip Overview', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dates: ${new Date(tripData.dates.startDate).toDateString()} - ${new Date(tripData.dates.endDate).toDateString()}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Duration: ${tripData.dates.duration} days`, margin, yPosition);
    yPosition += 6;
    doc.text(`Participants: ${tripData.participants.adults} adults, ${tripData.participants.children} children`, margin, yPosition);
    yPosition += 6;

    if (tripData.destinations) {
      doc.text(`From: ${tripData.destinations.origin.name}`, margin, yPosition);
      yPosition += 6;
      doc.text(`To: ${tripData.destinations.destination.name}`, margin, yPosition);
      yPosition += 10;
    }

    // Budget Summary
    if (tripData.budget) {
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Budget Summary', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Budget: ${tripData.budget.currency} ${tripData.budget.total.toLocaleString()}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Per Person: ${tripData.budget.currency} ${tripData.budget.perPerson.toLocaleString()}`, margin, yPosition);
      yPosition += 8;

      // Budget breakdown
      Object.entries(tripData.budget.breakdown).forEach(([category, amount]) => {
        doc.text(`${category.charAt(0).toUpperCase() + category.slice(1)}: ${tripData.budget!.currency} ${amount.toLocaleString()}`, margin + 10, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }

    // Transportation
    if (options.includeAccommodations !== false && tripData.transportation.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Transportation', margin, yPosition);
      yPosition += 10;

      tripData.transportation.forEach((transport) => {
        checkPageBreak(25);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${transport.type.toUpperCase()}: ${transport.provider}`, margin, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${transport.from.name} → ${transport.to.name}`, margin + 10, yPosition);
        yPosition += 5;
        doc.text(`Departure: ${new Date(transport.departure).toLocaleString()}`, margin + 10, yPosition);
        yPosition += 5;
        doc.text(`Arrival: ${new Date(transport.arrival).toLocaleString()}`, margin + 10, yPosition);
        yPosition += 5;
        
        if (transport.price) {
          doc.text(`Price: ${transport.price.currency} ${transport.price.amount}`, margin + 10, yPosition);
          yPosition += 5;
        }
        
        if (transport.bookingReference) {
          doc.text(`Booking Ref: ${transport.bookingReference}`, margin + 10, yPosition);
          yPosition += 5;
        }
        
        yPosition += 3;
      });
    }

    // Accommodations
    if (options.includeAccommodations !== false && tripData.accommodations.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Accommodations', margin, yPosition);
      yPosition += 10;

      tripData.accommodations.forEach((hotel) => {
        checkPageBreak(30);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(hotel.name, margin, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(hotel.location.address, margin + 10, yPosition);
        yPosition += 5;
        doc.text(`Check-in: ${new Date(hotel.checkIn).toDateString()}`, margin + 10, yPosition);
        yPosition += 5;
        doc.text(`Check-out: ${new Date(hotel.checkOut).toDateString()}`, margin + 10, yPosition);
        yPosition += 5;
        doc.text(`${hotel.nights} nights, ${hotel.rooms} rooms, ${hotel.guests} guests`, margin + 10, yPosition);
        yPosition += 5;
        
        if (hotel.price) {
          doc.text(`Total: ${hotel.price.currency} ${hotel.price.amount} (${hotel.price.currency} ${hotel.price.perNight}/night)`, margin + 10, yPosition);
          yPosition += 5;
        }
        
        if (hotel.amenities.length > 0) {
          const amenityText = `Amenities: ${hotel.amenities.join(', ')}`;
          const amenityLines = doc.splitTextToSize(amenityText, maxWidth - 10);
          doc.text(amenityLines, margin + 10, yPosition);
          yPosition += amenityLines.length * 5;
        }
        
        yPosition += 3;
      });
    }

    // Activities
    if (options.includeActivities !== false && tripData.activities.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Activities', margin, yPosition);
      yPosition += 10;

      // Group activities by date
      const activitiesByDate = tripData.activities.reduce((groups, activity) => {
        const date = new Date(activity.dateTime).toDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(activity);
        return groups;
      }, {} as Record<string, ActivityInfo[]>);

      Object.entries(activitiesByDate).forEach(([date, activities]) => {
        checkPageBreak(15);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(date, margin, yPosition);
        yPosition += 8;

        activities.forEach((activity) => {
          checkPageBreak(20);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(activity.name, margin + 10, yPosition);
          yPosition += 5;

          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`${activity.category} • ${new Date(activity.dateTime).toLocaleTimeString()}`, margin + 10, yPosition);
          yPosition += 4;
          doc.text(activity.location.address, margin + 10, yPosition);
          yPosition += 4;
          
          if (activity.description) {
            const descLines = doc.splitTextToSize(activity.description, maxWidth - 20);
            doc.text(descLines, margin + 10, yPosition);
            yPosition += descLines.length * 4;
          }
          
          if (activity.price) {
            doc.text(`Price: ${activity.price.currency} ${activity.price.amount}${activity.price.perPerson ? ' per person' : ''}`, margin + 10, yPosition);
            yPosition += 4;
          }
          
          yPosition += 2;
        });
        yPosition += 5;
      });
    }

    // Dining
    if (options.includeDining !== false && tripData.dining.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Dining', margin, yPosition);
      yPosition += 10;

      tripData.dining.forEach((restaurant) => {
        checkPageBreak(20);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(restaurant.name, margin, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${restaurant.cuisine} • ${restaurant.priceRange}`, margin + 10, yPosition);
        yPosition += 5;
        doc.text(restaurant.location.address, margin + 10, yPosition);
        yPosition += 5;
        
        if (restaurant.reservationTime) {
          doc.text(`Reservation: ${new Date(restaurant.reservationTime).toLocaleString()}`, margin + 10, yPosition);
          yPosition += 5;
        }
        
        doc.text(`Party size: ${restaurant.partySize}`, margin + 10, yPosition);
        yPosition += 5;
        
        if (restaurant.dietary && restaurant.dietary.length > 0) {
          doc.text(`Dietary: ${restaurant.dietary.join(', ')}`, margin + 10, yPosition);
          yPosition += 5;
        }
        
        yPosition += 3;
      });
    }

    // Notes
    if (options.includeNotes && tripData.notes) {
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const noteLines = doc.splitTextToSize(tripData.notes, maxWidth);
      doc.text(noteLines, margin, yPosition);
    }

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated by Tripthesia • Page ${i} of ${pageCount}`, margin, pageHeight - 10);
      doc.text(new Date().toLocaleDateString(), doc.internal.pageSize.width - margin - 30, pageHeight - 10);
    }

    return doc.output('arraybuffer') as ArrayBuffer;
  }

  // ==================== ICS GENERATION ====================

  private generateICS(tripData: TripData, options: ExportOptions): string {
    const formatDate = (date: string): string => {
      return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Tripthesia//Trip Calendar//EN
CALSCALE:GREGORIAN
`;

    // Trip overview event
    ics += `BEGIN:VEVENT
UID:trip-${tripData.id}-overview@tripthesia.com
DTSTART:${formatDate(tripData.dates.startDate)}
DTEND:${formatDate(tripData.dates.endDate)}
SUMMARY:${this.escapeICS(tripData.title)}
DESCRIPTION:${this.escapeICS(tripData.description || 'Trip to ' + tripData.destinations.destination.name)}
LOCATION:${this.escapeICS(tripData.destinations.destination.name)}
STATUS:CONFIRMED
TRANSP:TRANSPARENT
END:VEVENT
`;

    // Transportation events
    tripData.transportation.forEach((transport) => {
      ics += `BEGIN:VEVENT
UID:transport-${transport.id}@tripthesia.com
DTSTART:${formatDate(transport.departure)}
DTEND:${formatDate(transport.arrival)}
SUMMARY:${this.escapeICS(`${transport.type.toUpperCase()}: ${transport.from.name} → ${transport.to.name}`)}
DESCRIPTION:${this.escapeICS(`${transport.provider}${transport.bookingReference ? '\\nBooking: ' + transport.bookingReference : ''}${transport.price ? '\\nPrice: ' + transport.price.currency + ' ' + transport.price.amount : ''}`)}
LOCATION:${this.escapeICS(transport.from.address)}
STATUS:CONFIRMED
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:${this.escapeICS(`${transport.type} departure reminder`)}
TRIGGER:-PT2H
END:VALARM
END:VEVENT
`;
    });

    // Accommodation events
    if (options.includeAccommodations !== false) {
      tripData.accommodations.forEach((hotel) => {
        // Check-in event
        ics += `BEGIN:VEVENT
UID:checkin-${hotel.id}@tripthesia.com
DTSTART:${formatDate(hotel.checkIn)}
DTEND:${formatDate(new Date(new Date(hotel.checkIn).getTime() + 60 * 60 * 1000).toISOString())}
SUMMARY:${this.escapeICS(`Check-in: ${hotel.name}`)}
DESCRIPTION:${this.escapeICS(`Check-in at ${hotel.name}\\n${hotel.location.address}${hotel.bookingReference ? '\\nBooking: ' + hotel.bookingReference : ''}${hotel.price ? '\\nTotal: ' + hotel.price.currency + ' ' + hotel.price.amount : ''}`)}
LOCATION:${this.escapeICS(hotel.location.address)}
STATUS:CONFIRMED
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Hotel check-in reminder
TRIGGER:-PT1H
END:VALARM
END:VEVENT
`;

        // Check-out event
        ics += `BEGIN:VEVENT
UID:checkout-${hotel.id}@tripthesia.com
DTSTART:${formatDate(hotel.checkOut)}
DTEND:${formatDate(new Date(new Date(hotel.checkOut).getTime() + 60 * 60 * 1000).toISOString())}
SUMMARY:${this.escapeICS(`Check-out: ${hotel.name}`)}
DESCRIPTION:${this.escapeICS(`Check-out from ${hotel.name}\\n${hotel.location.address}`)}
LOCATION:${this.escapeICS(hotel.location.address)}
STATUS:CONFIRMED
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Hotel check-out reminder
TRIGGER:-PT1H
END:VALARM
END:VEVENT
`;
      });
    }

    // Activity events
    if (options.includeActivities !== false) {
      tripData.activities.forEach((activity) => {
        const endTime = new Date(new Date(activity.dateTime).getTime() + activity.duration * 60 * 1000);
        
        ics += `BEGIN:VEVENT
UID:activity-${activity.id}@tripthesia.com
DTSTART:${formatDate(activity.dateTime)}
DTEND:${formatDate(endTime.toISOString())}
SUMMARY:${this.escapeICS(activity.name)}
DESCRIPTION:${this.escapeICS(`${activity.category}${activity.description ? '\\n' + activity.description : ''}${activity.price ? '\\nPrice: ' + activity.price.currency + ' ' + activity.price.amount + (activity.price.perPerson ? ' per person' : '') : ''}${activity.bookingReference ? '\\nBooking: ' + activity.bookingReference : ''}`)}
LOCATION:${this.escapeICS(activity.location.address)}
STATUS:${activity.bookingRequired ? 'TENTATIVE' : 'CONFIRMED'}
${activity.bookingRequired ? 'BEGIN:VALARM\nACTION:DISPLAY\nDESCRIPTION:Book activity reminder\nTRIGGER:-P1D\nEND:VALARM\n' : ''}END:VEVENT
`;
      });
    }

    // Dining events
    if (options.includeDining !== false) {
      tripData.dining.forEach((restaurant) => {
        if (restaurant.reservationTime) {
          const endTime = new Date(new Date(restaurant.reservationTime).getTime() + 2 * 60 * 60 * 1000); // 2 hours default
          
          ics += `BEGIN:VEVENT
UID:dining-${restaurant.id}@tripthesia.com
DTSTART:${formatDate(restaurant.reservationTime)}
DTEND:${formatDate(endTime.toISOString())}
SUMMARY:${this.escapeICS(`Dinner: ${restaurant.name}`)}
DESCRIPTION:${this.escapeICS(`${restaurant.cuisine} • ${restaurant.priceRange}\\nParty size: ${restaurant.partySize}${restaurant.dietary?.length ? '\\nDietary: ' + restaurant.dietary.join(', ') : ''}${restaurant.reservationReference ? '\\nReservation: ' + restaurant.reservationReference : ''}`)}
LOCATION:${this.escapeICS(restaurant.location.address)}
STATUS:CONFIRMED
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Restaurant reservation reminder
TRIGGER:-PT1H
END:VALARM
END:VEVENT
`;
        }
      });
    }

    ics += 'END:VCALENDAR';
    return ics;
  }

  // ==================== JSON GENERATION ====================

  private generateJSON(tripData: TripData, options: ExportOptions): string {
    const exportData = {
      ...tripData,
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        format: 'json',
        version: '1.0',
        options: options
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  // ==================== UTILITY FUNCTIONS ====================

  private getAllWaypoints(tripData: TripData, options: ExportOptions): Location[] {
    const waypoints: Location[] = [];

    // Add origin and destination
    if (tripData.destinations) {
      waypoints.push(tripData.destinations.origin);
      if (tripData.destinations.waypoints) {
        waypoints.push(...tripData.destinations.waypoints);
      }
      waypoints.push(tripData.destinations.destination);
    }

    // Add accommodation locations
    if (options.includeAccommodations !== false) {
      tripData.accommodations.forEach(hotel => {
        waypoints.push(hotel.location);
      });
    }

    // Add activity locations
    if (options.includeActivities !== false) {
      tripData.activities.forEach(activity => {
        waypoints.push(activity.location);
      });
    }

    // Add dining locations
    if (options.includeDining !== false) {
      tripData.dining.forEach(restaurant => {
        waypoints.push(restaurant.location);
      });
    }

    // Remove duplicates based on coordinates
    const uniqueWaypoints = waypoints.filter((point, index, array) => 
      array.findIndex(p => 
        Math.abs(p.coordinates[0] - point.coordinates[0]) < 0.0001 && 
        Math.abs(p.coordinates[1] - point.coordinates[1]) < 0.0001
      ) === index
    );

    return uniqueWaypoints;
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private escapeICS(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  /**
   * Utility method to download the exported file
   */
  static downloadFile(result: ExportResult): void {
    if (!result.success || !result.data) {
      console.error('Export failed:', result.error);
      return;
    }

    const blob = new Blob([result.data], { type: result.mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}