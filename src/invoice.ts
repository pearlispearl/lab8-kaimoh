import { removeAccessToken, getAccessToken } from './tokenService.js'; 
import { Invoice, Client } from './model.js';
const BASE_URL = 'http://203.159.93.114:3100';
const INVOICE_API_URL = 'http://203.159.93.114:3100/invoice';

interface SearchCriteria {
  companyName?: string;
  clientEmail?: string;
  startDate?: string;
  endDate?: string;
}

function normalizeToDateOnly(dateString?: string): Date | null {
  if (!dateString) return null;

  // Extract only the YYYY-MM-DD part
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const [_, year, month, day] = match;
  // Create date in local timezone (midnight local time)
  const localDate = new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
  return localDate;
}
async function searchInvoices(criteria: SearchCriteria): Promise<Invoice[]> {
  const allInvoices = await fetchInvoices();
  const results: Invoice[] = [];
  const clientCache: Record<number, Client | undefined> = {};
  
  const startDate = criteria.startDate ? new Date(criteria.startDate) : null;
  let endDate: Date | null = null;
  if (criteria.endDate) {
    // Create a mutable Date object from the input string
    const end = new Date(criteria.endDate);
    // Move the date to the *start* of the next day to ensure the search is inclusive.
    end.setDate(end.getDate() + 1); 
    endDate = end;
  }
  for (const inv of allInvoices) {
    // Fetch client data (cached)
    let client: Client | null | undefined = clientCache[inv.client_id];
    if (!client) {
      client = await getClientById(inv.client_id);
      if (client) clientCache[inv.client_id] = client;
    }

    const matchCompany = criteria.companyName
      ? client?.company_name?.toLowerCase().includes(criteria.companyName.toLowerCase())
      : true;

    const matchEmail = criteria.clientEmail
      ? client?.email?.toLowerCase().includes(criteria.clientEmail.toLowerCase())
      : true;

    // const issueDate = inv.issue_date ? new Date(inv.issue_date) : null;
    // const startDate = criteria.startDate ? new Date(criteria.startDate) : null;
    // const endDate = criteria.endDate ? new Date(criteria.endDate) : null;

    // const matchStart = startDate ? (issueDate && issueDate >= startDate) : true;
    // const matchEnd = endDate ? (issueDate && issueDate <= endDate) : true;
    const issueDate = inv.issue_date ? new Date(inv.issue_date) : null;
    const dueDate = inv.due_date ? new Date(inv.due_date) : null; // 👈 ADDED: Parse Due Date
    
    // Check if Issue Date is within range
    const matchIssueStart = startDate ? (issueDate && issueDate >= startDate) : true;
    const matchIssueEnd = endDate ? (issueDate && issueDate < endDate) : true; // Use '<' against the start of the next day
    
    // 👈 ADDED: Check if Due Date is within range
    const matchDueStart = startDate ? (dueDate && dueDate >= startDate) : true;
    const matchDueEnd = endDate ? (dueDate && dueDate < endDate) : true; // Use '<' against the start of the next day
    // 👈 MODIFIED: ALL date conditions must be true
    if (matchCompany && matchEmail && matchIssueStart && matchIssueEnd && matchDueStart && matchDueEnd) {
      results.push(inv);
    }
  }
//     if (matchCompany && matchEmail && matchStart && matchEnd) {
//       results.push(inv);
//     }
//   }

  return results;
}


async function fetchInvoices(): Promise<Invoice[]> {
    const token = getAccessToken(); // 🔑 Retrieve the token from localStorage

    if (!token) {
        // Redirect to login if the user is not authenticated
        window.location.href = 'login.html';
        throw new Error('No access token found. Redirecting to login.');
    }

    try {
        const response = await fetch(INVOICE_API_URL, {
            method: 'GET',
            headers: {
                // 🔑 Attach the token to the Authorization header
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json',

                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
        });

        if (response.status === 401) {
            // Token expired or invalid: clear it and redirect
            removeAccessToken(); 
            window.location.href = 'login.html';
            throw new Error('Token expired. Re-authentication required.');
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch invoices. Status: ${response.status}`);
        }

        // Assuming the API returns an array of invoices
        const data: Invoice[] = await response.json(); 
        return data;

    } catch (error) {
        console.error('Invoice Fetch Error:', error);
        alert('Could not load invoice data.');
        return []; // Return empty array on failure
    }
}

async function getClientById(client_id: number): Promise<Client | null> {
    const token = getAccessToken();
    if (!token) return null;

    try {
        // 🔑 The URL requires the value, regardless of the parameter name in Swagger.
        // We use the value of the client_id variable here.
        const url = `${BASE_URL}/client/${client_id}`; // Path is correct: /client/1, /client/2, etc.
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.status === 401) {
            console.error('Client lookup token expired.');
            return null;
        }

        if (!response.ok) {
            console.error(`Failed to fetch client ${client_id}. Status: ${response.status}`);
            return null;
        }

        const clientData: Client = await response.json();
        return clientData;

    } catch (error) {
        console.error(`Error fetching client ${client_id}:`, error);
        return null;
    }
}


async function displayInvoices(invoices: Invoice[]) {
    const container = document.getElementById('invoice-table-body'); 
    if (!container) return;

    if (invoices.length === 0) {
        container.innerHTML = '<tr><td colspan="8" class="text-center py-5 text-gray-500">No invoices found.</td></tr>';
        return;
    }
    const clientCache: Record<number, Client | undefined> = {}; // 🔒 simple cache to avoid refetching same clients
    let html = '';

    // const html = invoices.map(invoice => {
        // Check keys: invoice_number, issue_date, due_date, company_name, quotation_number, total_amount, status
    // const statusClass = invoice.status === 'Paid' ? 'text-green-700' : 'text-blue-700'; 
    for (const invoice of invoices) {
    // Check cache first
    let client: Client | null = clientCache[invoice.client_id] || null;

    // If not in cache, fetch and store it
    if (!client) {
      client = await getClientById(invoice.client_id);
      if (client) clientCache[invoice.client_id] = client;
    }
    const companyName = client?.company_name || 'N/A';
    const clientEmail = client?.email || 'N/A';
    const statusClass = invoice.status === 'Paid' ? 'text-green-700' : 'text-blue-700';
    html += `
      <tr class="border-b">
        <td class="pl-[15px] pr-6 py-2">${invoice.invoice_number || 'N/A'}</td>
        <td class="px-10 py-2">${invoice.issue_date || 'N/A'}</td>
        <td class="px-6 py-2">${invoice.due_date || 'N/A'}</td>
        <td class="px-6 py-2">${invoice.client_id || 'N/A'}</td>
        <td class="px-8 py-2">${invoice.quotation_number || 'N/A'}</td>
        <td class="px-6 py-2 text-start">฿${Number(invoice.subtotal || 0).toFixed(2)}</td>
        <td class="px-6 py-2 text-start">${companyName}</td>
        <td class="px-6 py-2 text-start">${clientEmail}</td>
        <td class="px-6 py-2 text-end ${statusClass} font-bold">${invoice.status || 'N/A'}</td>
      </tr>
    `;
  }
    //     return `
    //         <tr class="border-b">
    //             <td class="pl-[15px] pr-6 py-2">${invoice.invoice_number || 'N/A'}</td>
    //             <td class="px-10 py-2">${invoice.issue_date || 'N/A'}</td>
    //             <td class="px-6 pr-[80px] py-2">${invoice.due_date || 'N/A'}</td>
    //             <td class="px-6 pr-[80px] py-2">${invoice.client_id || 'N/A'}</td> 
    //             <td class="px-8 py-2 pr-[130px]">${invoice.quotation_number || 'N/A'}</td>
    //             <td class="px-6 py-2 pr-[40px] pl-[5px] text-start">฿${Number(invoice.subtotal || 0).toFixed(2)}</td> 
    //             <td class="px-6 py-2 pr-[40px] pl-[5px] text-start">฿${invoice.company_name}</td>
    //             <td class="px-6 py-2 flex justify-end text-end ${statusClass} font-bold">${invoice.status || 'N/A'}</td>
    //         </tr>
    //     `;
    // }).join('');

    container.innerHTML = html;
}

async function handleSearchSubmit(event: Event) {
    event.preventDefault(); // Stop the form from submitting normally (reloading the page)

    // 1. Get values from the HTML inputs (using the IDs we fixed)
    const clientIdInput = document.getElementById('search-client-id') as HTMLInputElement;
    const companyNameInput = document.getElementById('search-company-name') as HTMLInputElement;
    const clientEmailInput = document.getElementById('search-client-email') as HTMLInputElement;
    const startDateInput = document.getElementById('start-date') as HTMLInputElement;
    const endDateInput = document.getElementById('end-date') as HTMLInputElement;

    const clientIdString = clientIdInput?.value.trim();    
    let invoices: Invoice[] = [];

    try {
        if (clientIdString) {
            // 🔑 CALL: If the Invoice Number field is filled, call the specific single retrieval function
            const clientId = Number(clientIdString);
            if (isNaN(clientId) || clientId <= 0) {
                 alert("Please enter a valid numeric Client ID.");
                 displayInvoices([]);
                 return;
            }
            // Fetch all invoices first
            const allInvoices = await fetchInvoices();
            // Filter by client_id
            invoices = allInvoices.filter(inv => inv.client_id === clientId);
        }else {
             const criteria: SearchCriteria = {
                companyName: companyNameInput?.value.trim(),
                clientEmail: clientEmailInput?.value.trim(),
                startDate: startDateInput?.value,
                endDate: endDateInput?.value,
            };
            invoices = await searchInvoices(criteria);
        }

        // 2. Display the results (either single invoice or search results)
        displayInvoices(invoices);

    } catch (error) {
        console.error('Search failed:', error);
        displayInvoices([]); // Clear the table on error
    }
}

// Execute the fetch and display logic when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
    const invoices = await fetchInvoices();
    displayInvoices(invoices);
  } catch (error) {
    console.error('Failed to load invoices:', error);
  }
const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearchSubmit);
    }
});