import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { BudgetService } from 'src/app/core/services/budget.service';

@Component({
  selector: 'app-ai-summary-modal',
  templateUrl: './ai-summary-modal.component.html',
  styleUrls: ['./ai-summary-modal.component.css']
})
export class AiSummaryModalComponent {

  constructor(
    private dialogRef: MatDialogRef<AiSummaryModalComponent>,
    private budget: BudgetService
  ) {}

  messages: { role: string, text: string }[] = [];
  userMessage = '';
  loading = false;

  closeDialog() {
    this.dialogRef.close();
  }

  sendMessage() {
    if (!this.userMessage.trim()) return;

    this.messages.push({ role: 'user', text: this.userMessage });
    const msg = this.userMessage;
    this.userMessage = '';
    this.loading = true;

    this.budget.getAiSummary(msg).subscribe({
      next: (res: any) => {
        this.messages.push({ role: 'ai', text: res.summary });
        this.loading = false;
      },
      error: () => {
        this.messages.push({ role: 'ai', text: 'Error fetching response!' });
        this.loading = false;
      }
    });
  }
}