import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BudgetService } from 'src/app/core/services/budget.service';

@Component({
  selector: 'app-add-expense-modal',
  templateUrl: './add-expense-modal.component.html',
  styleUrls: ['./add-expense-modal.component.css']
})
export class AddExpenseModalComponent implements OnInit {

  form!: FormGroup;
  submitted = false;
    scanning = false;
scanned = false;
   receiptUrl: string = '';

  categories: any[] = [];

  
  constructor(
    private dialogRef: MatDialogRef<AddExpenseModalComponent>,
    private budget : BudgetService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private router: Router,
      @Inject(MAT_DIALOG_DATA) public data: any   
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      amount: ['', Validators.required],
      date: ['', Validators.required],
      category: ['', Validators.required],
      payment: ['', Validators.required],
      currency: ['INR', Validators.required],
      notes: [''],
      vendor: ['']

    });

    // Load categories first: mat-select needs options before patchValue or category stays invalid
    this.budget.getAllCategories().subscribe({
      next: (res: any) => {
        this.categories = Array.isArray(res) ? res : [];
        this.patchEditFormIfNeeded();
      },
      error: (err) => {
        console.error(err);
        this.patchEditFormIfNeeded();
      }
    });
  }

  private patchEditFormIfNeeded() {
    if (!this.data?.id) return;
    this.form.patchValue({
      title: this.data.title,
      amount: this.data.amount,
      date: this.apiExpenseDateToHtmlDate(this.data.expense_date),
      category: this.data.category,
      payment: this.paymentFromApi(this.data.payment_method),
      currency: this.data.currency || 'INR',
      notes: this.data.notes ?? '',
      vendor: this.data.vendor ?? ''
    });
    this.form.updateValueAndValidity({ emitEvent: false });
  }

  /** List API returns DD-MM-YYYY; <input type="date"> needs YYYY-MM-DD */
  private apiExpenseDateToHtmlDate(display: string | undefined): string {
    if (!display) return '';
    const s = String(display).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    let m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(s);
    if (!m) m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
    if (!m) return '';
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  /** DB may store lowercase; mat-select options use Cash / UPI / Card */
  private paymentFromApi(method: string | undefined): string {
    if (!method) return '';
    const key = method.trim().toLowerCase();
    const map: Record<string, string> = { cash: 'Cash', upi: 'UPI', card: 'Card' };
    return map[key] || method;
  }

  get f() {
    return this.form.controls;
  }

  close() {
    this.dialogRef.close();
  }



//   submit() {
//   this.submitted = true;

//   if (this.form.invalid) return;

//   const payload = {
//     ...this.form.value,
//     expense_date: this.form.value.date,
//     payment_method: this.form.value.payment
//   };

//   this.budget.addExpense(payload).subscribe({
//     next: (data) => {
//       console.log("✅ Expense added:", data);
//     },
//     error: (err) => {
//       console.log("❌ failed post api", err);
//     }
//   });

//   this.dialogRef.close(payload);
// }
// }

  submit() {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.form.value,
      expense_date: this.form.value.date,
      payment_method: this.form.value.payment,
      vendor: this.form.value.vendor,
      receipt_url: this.receiptUrl
    };
     
    console.log("Payload:", payload);

    if (this.data && this.data.id) {
      this.budget.updateExpense(this.data.id, payload).subscribe({
        next: (data: any) => {
          console.log("✅ Expense updated:", data);
          this.dialogRef.close(payload);
        },
        error: (err: any) => {
          console.log("❌ failed update api", err);
          this.handleExpenseSaveError(err);
        }
      });
    } else {
      this.budget.addExpense(payload).subscribe({
        next: (data: any) => {
          console.log("✅ Expense added:", data);
          this.dialogRef.close(payload);
        },
        error: (err: any) => {
          console.log("❌ failed post api", err);
          this.handleExpenseSaveError(err);
        }
      });
    }
  }

  private handleExpenseSaveError(err: any): void {
    const msg = err?.error?.message || 'Could not save expense';
    this.toastr.error(msg);
    if (err?.status === 403 && err?.error?.code === 'CONTACT_INCOMPLETE') {
      this.dialogRef.close();
      this.router.navigate(['/profile/edit']);
    }
  }

  
    onReceiptUpload(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  this.scanning = true;

const formData = new FormData();
formData.append('receipt', file);
this.budget.scanReceipt(file).subscribe({
  next: (res: any) => {
    if (res.receiptUrl) {
      this.receiptUrl = res.receiptUrl;
      console.log("Receipt saved:", this.receiptUrl);
    }
  }
});

  this.scanned = false;

  const reader = new FileReader();
  reader.onload = async (e: any) => {
    const imageData = e.target.result;

    const Tesseract = (window as any).Tesseract;
    
    if (!Tesseract) {
      console.error("Tesseract not loaded");
      this.scanning = false;
      return;
    }

    try {
      const result = await Tesseract.recognize(imageData, 'eng');
      const text = result.data.text;
      console.log("OCR Text:", text);

      // ✅ Pehle TOTAL AMOUNT dhundho, phir baaki
      let amount = '';
      const totalMatch = text.match(
        /TOTAL\s*AMOUNT\s*(?:rs\.?)?\s*(\d{1,6}(?:[.,]\d{1,2})?)/i
      );
      if (totalMatch) {
        amount = totalMatch[1].replace(',', '');
      } else {
        const amountMatch = text.match(
          /(?:grand\s*total|net\s*amount|amount\s*paid)\s*[:\-]?\s*(?:rs\.?)?\s*(\d{1,6}(?:[.,]\d{1,2})?)/i
        );
        if (amountMatch) amount = amountMatch[1].replace(',', '');
      }
      if (amount) this.form.patchValue({ amount });

      // ✅ Date dhundho - validation ke saath
      const dateMatch = text.match(
        /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/
      );
      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]);
        let year = dateMatch[3];
        if (year.length === 2) year = '20' + year;
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
          const formattedDate = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          this.form.patchValue({ date: formattedDate });
        }
      }

      // ✅ Vendor name - pehli line
      const lines = text.split('\n').filter((l: string) => l.trim());
      if (lines[0]) this.form.patchValue({ vendor: lines[0].trim() });

      this.scanning = false;
      this.scanned = true;

    } catch (err) {
      console.error("OCR Error:", err);
      this.scanning = false;
    }
  };
  reader.readAsDataURL(file);
}
}
