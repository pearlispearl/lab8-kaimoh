var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createInvoice } from "./invoice.js";
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('create-invoice-form');
    if (!form)
        return;
    form.addEventListener('submit', (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        // **FIX**: Create a data object that EXACTLY matches the API documentation
        const invoiceData = {
            invoice_number: document.getElementById('invoice_number').value,
            client_id: parseInt(document.getElementById('client_id').value),
            quotation_number: document.getElementById('quotation_number').value,
            issue_date: document.getElementById('issue_date').value,
            due_date: document.getElementById('due_date').value,
            status: document.getElementById('status').value,
            subtotal: document.getElementById('subtotal').value,
            tax_amount: document.getElementById('tax_amount').value,
            total_amount: document.getElementById('total_amount').value,
            currency: document.getElementById('currency').value,
            notes: document.getElementById('notes').value,
            created_by: parseInt(document.getElementById('created_by').value),
            amount_paid: "0",
        };
        // Basic validation
        if (!invoiceData.client_id || !invoiceData.issue_date || !invoiceData.due_date) {
            alert("Please fill out all required fields (*).");
            return;
        }
        try {
            // Corrected call: No need to pass authToken now
            yield createInvoice(invoiceData);
            alert('Invoice created successfully!');
            window.location.href = './invoice.html';
        }
        catch (err) {
            // Note: If the token is missing/expired, this catch block is reached *after* the redirect has been initiated.
            alert(`Error creating invoice: ${err.message}`);
        }
    }));
});
