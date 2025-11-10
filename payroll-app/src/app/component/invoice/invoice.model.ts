export interface InvoiceModel {
    id: number;
    invoiceNumber: string;
    services: string;
    status: string;
    total: number;
    createdAt: Date;
}
