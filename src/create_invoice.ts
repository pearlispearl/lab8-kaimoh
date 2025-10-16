import { createInvoice } from "./invoice.js";
import { Invoice } from "./model.js";

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById('create-invoice-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // **FIX**: Create a data object that EXACTLY matches the API documentation
        const invoiceData = {
            invoice_number: (document.getElementById('invoice_number') as HTMLSelectElement).value ,
            client_id: parseInt((document.getElementById('client_id') as HTMLInputElement).value),
            quotation_number: (document.getElementById('quotation_number') as HTMLSelectElement).value,
            issue_date: (document.getElementById('issue_date') as HTMLInputElement).value,
            due_date: (document.getElementById('due_date') as HTMLInputElement).value,
            status: (document.getElementById('status') as HTMLSelectElement).value,
            subtotal: (document.getElementById('subtotal') as HTMLInputElement).value,
            tax_amount: (document.getElementById('tax_amount') as HTMLInputElement).value,
            total_amount:(document.getElementById('total_amount') as HTMLInputElement).value,
            currency: (document.getElementById('currency') as HTMLInputElement).value,
            notes: (document.getElementById('notes') as HTMLTextAreaElement).value,
            created_by: parseInt((document.getElementById('created_by') as HTMLInputElement).value),
            amount_paid: "0",
        };
        
        // Basic validation
        if (!invoiceData.client_id || !invoiceData.issue_date || !invoiceData.due_date) {
            alert("Please fill out all required fields (*).");
            return;
        }
        
        try {
            // Corrected call: No need to pass authToken now
            await createInvoice(invoiceData as Partial<Invoice>); 
            alert('Invoice created successfully!');
            window.location.href = './invoice.html'; 
        } catch (err: any) {
            // Note: If the token is missing/expired, this catch block is reached *after* the redirect has been initiated.
            alert(`Error creating invoice: ${err.message}`); 
        }
    });
});
