// This is a Vercel Serverless Function.
// It fetches data from the MPI RSS feed and returns it as JSON.

// Import the XML parser library.
const { XMLParser } = require("fast-xml-parser");

// The correct, current URL for the MPI feed.
const MPI_RECALLS_RSS_URL = 'https://www.mpi.govt.nz/feeds/food-recalls.rss';

// Define the main function handler.
export default async function handler(req, res) {
  try {
    // Fetch the data from MPI. We include a User-Agent header to act like a real browser,
    // which prevents many automated blocking issues.
    const response = await fetch(MPI_RECALLS_RSS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // If the response from MPI is not successful, throw an error.
    if (!response.ok) {
      throw new Error(`MPI server responded with status: ${response.status}`);
    }

    // Get the XML content from the response.
    const xmlContent = await response.text();

    // Create a new parser instance.
    const parser = new XMLParser();
    const feedObj = parser.parse(xmlContent);

    // Extract the list of items from the parsed feed.
    const items = feedObj?.rss?.channel?.item || [];

    // Send the successful JSON response back to the frontend.
    // Set caching headers to prevent stale data.
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate'); // Cache for 10 minutes
    res.status(200).json(items);

  } catch (error) {
    // If anything in the 'try' block fails, log the error on the Vercel server
    // and send a generic 500 error back to the frontend.
    console.error("Error in MPI feed function:", error);
    res.status(500).json({ error: 'Failed to retrieve feed data.', details: error.message });
  }
}
