var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { removeAccessToken, getAccessToken } from './tokenService.js';
const BASE_URL = 'http://203.159.93.114:3100';
const INVOICE_API_URL = 'http://203.159.93.114:3100/invoice';
function normalizeToDateOnly(dateString) {
    if (!dateString)
        return null;
    // Extract only the YYYY-MM-DD part
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match)
        return null;
    const [_, year, month, day] = match;
    // Create date in local timezone (midnight local time)
    const localDate = new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
    return localDate;
}
function searchInvoices(criteria) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const allInvoices = yield fetchInvoices();
        const results = [];
        const clientCache = {};
        const startDate = criteria.startDate ? new Date(criteria.startDate) : null;
        let endDate = null;
        if (criteria.endDate) {
            // Create a mutable Date object from the input string
            const end = new Date(criteria.endDate);
            // Move the date to the *start* of the next day to ensure the search is inclusive.
            end.setDate(end.getDate() + 1);
            endDate = end;
        }
        for (const inv of allInvoices) {
            // Fetch client data (cached)
            let client = clientCache[inv.client_id];
            if (!client) {
                client = yield getClientById(inv.client_id);
                if (client)
                    clientCache[inv.client_id] = client;
            }
            const matchCompany = criteria.companyName
                ? (_a = client === null || client === void 0 ? void 0 : client.company_name) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(criteria.companyName.toLowerCase())
                : true;
            const matchEmail = criteria.clientEmail
                ? (_b = client === null || client === void 0 ? void 0 : client.email) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(criteria.clientEmail.toLowerCase())
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
    });
}
function fetchInvoices() {
    return __awaiter(this, void 0, void 0, function* () {
        const token = getAccessToken(); // 🔑 Retrieve the token from localStorage
        if (!token) {
            // Redirect to login if the user is not authenticated
            window.location.href = 'login.html';
            throw new Error('No access token found. Redirecting to login.');
        }
        try {
            const response = yield fetch(INVOICE_API_URL, {
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
            const data = yield response.json();
            return data;
        }
        catch (error) {
            console.error('Invoice Fetch Error:', error);
            alert('Could not load invoice data.');
            return []; // Return empty array on failure
        }
    });
}
function getClientById(client_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = getAccessToken();
        if (!token)
            return null;
        try {
            // 🔑 The URL requires the value, regardless of the parameter name in Swagger.
            // We use the value of the client_id variable here.
            const url = `${BASE_URL}/client/${client_id}`; // Path is correct: /client/1, /client/2, etc.
            const response = yield fetch(url, {
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
            const clientData = yield response.json();
            return clientData;
        }
        catch (error) {
            console.error(`Error fetching client ${client_id}:`, error);
            return null;
        }
    });
}
function displayInvoices(invoices) {
    return __awaiter(this, void 0, void 0, function* () {
        const container = document.getElementById('invoice-table-body');
        if (!container)
            return;
        if (invoices.length === 0) {
            container.innerHTML = '<tr><td colspan="8" class="text-center py-5 text-gray-500">No invoices found.</td></tr>';
            return;
        }
        const clientCache = {}; // 🔒 simple cache to avoid refetching same clients
        let html = '';
        // const html = invoices.map(invoice => {
        // Check keys: invoice_number, issue_date, due_date, company_name, quotation_number, total_amount, status
        // const statusClass = invoice.status === 'Paid' ? 'text-green-700' : 'text-blue-700'; 
        for (const invoice of invoices) {
            // Check cache first
            let client = clientCache[invoice.client_id] || null;
            // If not in cache, fetch and store it
            if (!client) {
                client = yield getClientById(invoice.client_id);
                if (client)
                    clientCache[invoice.client_id] = client;
            }
            const companyName = (client === null || client === void 0 ? void 0 : client.company_name) || 'N/A';
            const clientEmail = (client === null || client === void 0 ? void 0 : client.email) || 'N/A';
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
    });
}
function handleSearchSubmit(event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault(); // Stop the form from submitting normally (reloading the page)
        // 1. Get values from the HTML inputs (using the IDs we fixed)
        const clientIdInput = document.getElementById('search-client-id');
        const companyNameInput = document.getElementById('search-company-name');
        const clientEmailInput = document.getElementById('search-client-email');
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const clientIdString = clientIdInput === null || clientIdInput === void 0 ? void 0 : clientIdInput.value.trim();
        let invoices = [];
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
                const allInvoices = yield fetchInvoices();
                // Filter by client_id
                invoices = allInvoices.filter(inv => inv.client_id === clientId);
            }
            else {
                const criteria = {
                    companyName: companyNameInput === null || companyNameInput === void 0 ? void 0 : companyNameInput.value.trim(),
                    clientEmail: clientEmailInput === null || clientEmailInput === void 0 ? void 0 : clientEmailInput.value.trim(),
                    startDate: startDateInput === null || startDateInput === void 0 ? void 0 : startDateInput.value,
                    endDate: endDateInput === null || endDateInput === void 0 ? void 0 : endDateInput.value,
                };
                invoices = yield searchInvoices(criteria);
            }
            // 2. Display the results (either single invoice or search results)
            displayInvoices(invoices);
        }
        catch (error) {
            console.error('Search failed:', error);
            displayInvoices([]); // Clear the table on error
        }
    });
}
// Execute the fetch and display logic when the page loads
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const invoices = yield fetchInvoices();
        displayInvoices(invoices);
    }
    catch (error) {
        console.error('Failed to load invoices:', error);
    }
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearchSubmit);
    }
}));
