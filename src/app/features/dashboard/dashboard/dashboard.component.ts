// import { Component, AfterViewInit, OnInit  } from '@angular/core';
// import { Chart, registerables } from 'chart.js';
// import { MatDialog } from '@angular/material/dialog';
// import { AddExpenseModalComponent } from '../add-expense-modal/add-expense-modal.component';
// import { BudgetService } from 'src/app/core/services/budget.service';
// import { AuthService } from 'src/app/core/services/auth.service';
// import { SocketService } from 'src/app/core/services/socket.service';

// Chart.register(...registerables);

// @Component({
//   selector: 'app-dashboard',
//   templateUrl: './dashboard.component.html',
//   styleUrls: ['./dashboard.component.css']
// })
// export class DashboardComponent implements OnInit, AfterViewInit {
  
//   constructor(private dialog: MatDialog,
//     private budget : BudgetService,
//     private user :  AuthService,
//     private socketService : SocketService
//   ) {}
//   userName = "";

//   userBudget = 0;

//   usedPercent = 0;

//   userExpense = 0;

//   selectedDeleteIndex: number | null = null;
//   selectedExpenseId: number | null = null;


//   remainsBudget = 0;

//   warning = '';

//   selectedNote: string | null = null;
 

 

//   displayedColumns: string[] = [
//     'title',
//     'amount',
//     'category',
//     'date',
//     'payment',
//     'notes',
//     'update',
//     'delete'
//   ];

//   tableDataSource : any[] = [];
//     categories: any[] = [];




//   getUserdetails(){
//     this.user.getUserDetails().subscribe({
//       next : (userDetails : any)=>{
//           console.log(userDetails.user.name);
//           this.userName = userDetails.user.name;
//       }
//     })
//   }


//   getCurrentBudget(){
//     this.budget.getCurrentBudget().subscribe({
//       next : (currentBudget : any) => {
//         console.log(currentBudget.amount_limit);
//         this.userBudget = Number(currentBudget.amount_limit);
//       },
//       error : (err) =>{
//         console.log(err);
//       }
//     });
//   }

//   getCurrentExpense(){
//     this.budget.getTotalExpense().subscribe({
//       next : (currentExpense : any) => {
//         console.log(currentExpense.totalExpense);
//        this.userExpense = Number(currentExpense.totalExpense);
//       }
//     })
//   }

 


  

//  remaining() {
//   let remains = this.userBudget - this.userExpense;
//   this.remainsBudget = remains;
// }



//   // Notes
//   openNotes(note: string) {
//     this.selectedNote = note;
//   }

//   closeNotes() {
//     this.selectedNote = null;
//   }

//   // Update
//  openEditExpense(element: any, index: number) {
//   const dialogRef = this.dialog.open(AddExpenseModalComponent, {
//     width: '40vw',
//     height: '70vh',
//     data: { ...element, index },   // ✅ data pass
//     panelClass: 'custom-dialog',
//     disableClose: true
//   });

//   dialogRef.afterClosed().subscribe(result => {
//     if (result) {
//       this.tableDataSource[index] = result;   // ✅ update row
//       this.tableDataSource = [...this.tableDataSource]; // refresh table
//     }
//   });
// }

//   // Delete popup
//   openDeleteDialog(expense: any, index: number) {
//   this.selectedDeleteIndex = index;
//   this.selectedExpenseId = expense.id; 
// }

//   closeDeleteDialog() {
//     this.selectedDeleteIndex = null;
//   }

//   confirmDelete() {
//     if (this.selectedDeleteIndex !== null) {
//       this.tableDataSource.splice(this.selectedDeleteIndex, 1);
//       this.tableDataSource = [...this.tableDataSource];
//       this.closeDeleteDialog();
//     }
//   }

//     deleteExpense() {
//   if (!this.selectedExpenseId) return;

//   this.budget.deleteExpense(this.selectedExpenseId).subscribe({
//     next: () => {
//       console.log("Deleted");

//   //UI update
//       if (this.selectedDeleteIndex !== null) {
//         this.tableDataSource.splice(this.selectedDeleteIndex, 1);
//         this.tableDataSource = [...this.tableDataSource];
//       }

//       this.closeDeleteDialog();
//     },
//     error: (err) => {
//       console.error("Delete failed", err);
//     }
//   });
// }
// openAddExpense() {
//   const dialogRef = this.dialog.open(AddExpenseModalComponent, {
//     width: '40vw',        // ✅ responsive width
//     height: '70vh',       // ✅ height control
//     maxWidth: '95vw',     // mobile safety
//     panelClass: 'custom-dialog',
//     disableClose: true
//   });

//   dialogRef.afterClosed().subscribe(result => {
//     if (result) {
//       this.tableDataSource = [...this.tableDataSource, result];
//     }
//   });
// }
// socketUpdate() {
//   const userId = JSON.parse(localStorage.getItem('userId')!);
//   console.log("userId:", userId);

//   this.socketService.connect(userId);

//   this.socketService.onExpenseUpdate().subscribe((data: any) => {
//     console.log("Expense Update:", data);
//     this.usedPercent = data.usedPercent;
//     this.warning = data.warning;
//   });
// }

// getTableData() {
//   this.budget.getAllExpense().subscribe({
//     next: (res : any) => {
//       console.log("Data:", res);
//       this.tableDataSource = res.data;
//     },
//     error: (err) => {
//       console.error("❌ Error:", err);
//     }
//   });
// }


//   loadCategories() {
//     this.budget.getAllCategories().subscribe({
//       next: (res :any) => {
//         console.log("cate" ,res);
//         this.categories = res;
//       },
//       error: (err) => {
//         console.error("Error fetching categories", err);
//       }
//     });
//   }

//  ngOnInit(): void {
  
//   this.getTableData();
//   this.getUserdetails();
//   this.getCurrentBudget();
//   this.getCurrentExpense();
//   this.remaining();
//   this.loadCategories();
// }

//   ngAfterViewInit(): void {
//     const labels = [
//       ...this.categories.map(c => c.name),
//       'Remaining'
//     ];

//     const values = [
//       ...this.categories.map(c => c.value),
//       this.remaining
//     ];

//     this.socketUpdate();

//    new Chart("expenseChart", {
//   type: 'doughnut',
//   data: {
//     labels: labels,
//     datasets: [
//       {
//         data: values,
//         backgroundColor: ['#4caf50', '#ff9800', '#9c27b0', '#e0e0e0']
//       }
//     ]
//   },
//   options: {
//     responsive: true,              // ✅ MUST
//     maintainAspectRatio: false,    // ✅ VERY IMPORTANT

//     plugins: {
//       legend: {
//         position: 'bottom'         // better for mobile
//       }
//     }
//   }
// });
//   }
// }




import { Component, AfterViewInit, OnInit, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { MatDialog } from '@angular/material/dialog';
import { AddExpenseModalComponent } from '../add-expense-modal/add-expense-modal.component';
import { BudgetService } from 'src/app/core/services/budget.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { SocketService } from 'src/app/core/services/socket.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { AiSummaryModalComponent } from '../ai-summary-modal/ai-summary-modal.component';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {

  constructor(
    private dialog: MatDialog,
    private budget: BudgetService,
    private user: AuthService,
    private socketService: SocketService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  userName = "";
  userBudget = 0;
  usedPercent = 0;
  userExpense = 0;
  remainsBudget = 0;
  warning = '';

  selectedDeleteIndex: number | null = null;
  selectedExpenseId: number | null = null;
  selectedNote: string | null = null;

  displayedColumns: string[] = [
    'title',
    'amount',
    'category',
    'date',
    'payment',
    'notes',
    'update',
    'delete'
  ];

  // tableDataSource: any[] = [];
   categories: any[] = [];
   selectedSort: string = 'latest';
tableDataSource = new MatTableDataSource<any>([]);
@ViewChild(MatPaginator) paginator!: MatPaginator;
  

  // ================= USER =================
  getUserdetails() {
    this.user.getUserDetails().subscribe({
      next: (userDetails: any) => {
        this.userName = userDetails.user.name;
      }
    });
  }

  // ================= BUDGET =================
  getCurrentBudget() {
    this.budget.getCurrentBudget().subscribe({
      next: (res: any) => {
        this.userBudget = Number(res.amount_limit);
        this.remaining();
      }
    });
  }

  // ================= EXPENSE =================
  getCurrentExpense() {
    this.budget.getTotalExpense().subscribe({
      next: (res: any) => {
        this.userExpense = Number(res.totalExpense);
        this.remaining(); // ✅ FIX
      }
    });
  }

  remaining() {
    this.remainsBudget = this.userBudget - this.userExpense;
  }

  // ================= TABLE =================
// getTableData() {
//   let sort : any = "";

//   if (this.selectedSort === 'latest') {
//     sort = "latest";
//   } else if (this.selectedSort === 'high') {
//     sort = "high";
//   } else if (this.selectedSort === 'low') {
//     sort = "low";
//   }

//   this.budget.getAllExpense(sort).subscribe({
//     // next: (res: any) => {
//     //   this.tableDataSource = res.data;
//     // },

// next: (res: any) => {
//       this.tableDataSource = new MatTableDataSource(res.data);
//       this.tableDataSource.paginator = this.paginator;
//     },


//     error: (err) => console.error(err)
//   });
// }

totalRecords = 0;

getTableData(page: number = 1) {
  let sort: any = "";

  if (this.selectedSort === 'latest') sort = "latest";
  else if (this.selectedSort === 'high') sort = "high";
  else if (this.selectedSort === 'low') sort = "low";

  this.budget.getAllExpense(sort, page, 5).subscribe({
    next: (res: any) => {
      this.tableDataSource = new MatTableDataSource(res.data);
      this.totalRecords = res.total;
    },
    error: (err) => console.error(err)
  });
}

// onPageChange(event: any) {
//   this.getTableData(event.pageIndex + 1);
// }

onPageChange(event: any) {
  const page = event.pageIndex + 1;
  this.router.navigate(['/dashboard/page', page]);
}

applySort(type: string) {
  this.selectedSort = type;
  this.getTableData(); // reload data with new sort
}

getSortLabel(): string {
  const map: any = {
    latest: 'Latest',
    high: 'High → Low',
    low: 'Low → High'
  };
  return map[this.selectedSort];
}

  // ================= ADD =================
  openAddExpense() {
    const dialogRef = this.dialog.open(AddExpenseModalComponent, {
      width: '40vw',
      height: '70vh',
      maxWidth: '95vw',
      panelClass: 'custom-dialog',
      disableClose: true
    });

    // dialogRef.afterClosed().subscribe(result => {
    //   if (result) {
    //     // ✅ TOP insert
    //     this.tableDataSource = [result, ...this.tableDataSource];

    //     // ✅ update totals
    //     this.getCurrentExpense();
    //   }

dialogRef.afterClosed().subscribe(result => {
  if (result) {
    this.tableDataSource.data = [result, ...this.tableDataSource.data];
    this.tableDataSource.paginator = this.paginator;
    this.getCurrentExpense();
  }

    });
  }

  // ================= EDIT =================
  openEditExpense(element: any, index: number) {
    const dialogRef = this.dialog.open(AddExpenseModalComponent, {
      width: '40vw',
      height: '70vh',
      data: { ...element, index },
      panelClass: 'custom-dialog',
      disableClose: true
    });

    // dialogRef.afterClosed().subscribe(result => {
    //   if (result) {
    //     this.tableDataSource[index] = result;
    //     this.tableDataSource = [...this.tableDataSource];
    //   }

dialogRef.afterClosed().subscribe(result => {
  if (result) {
    const updated = [...this.tableDataSource.data];
    updated[index] = result;
    this.tableDataSource.data = updated;
  }

    });
  }

  // ================= DELETE =================
  // openDeleteDialog(expense: any, index: number) {
  //   this.selectedDeleteIndex = index;
  //   this.selectedExpenseId = expense.id;
  // }

  openDeleteDialog(expense: any) {
  this.selectedDeleteIndex = this.tableDataSource.data.indexOf(expense);
  this.selectedExpenseId = expense.id;
}

  closeDeleteDialog() {
    this.selectedDeleteIndex = null;
    this.selectedExpenseId = null;
  }

    // deleteExpense() {
    // if (!this.selectedExpenseId) return;

     //  this.budget.deleteExpense(this.selectedExpenseId).subscribe({
  //     next: () => {
  //       if (this.selectedDeleteIndex !== null) {
  //         this.tableDataSource.splice(this.selectedDeleteIndex, 1);
  //         this.tableDataSource = [...this.tableDataSource];
  //       }

       deleteExpense() {
  if (!this.selectedExpenseId) return;

  this.budget.deleteExpense(this.selectedExpenseId).subscribe({
    next: () => {
      if (this.selectedDeleteIndex !== null) {
        const updated = [...this.tableDataSource.data];
        updated.splice(this.selectedDeleteIndex, 1);
        this.tableDataSource.data = updated;
        this.tableDataSource.paginator = this.paginator;
      }

      this.getCurrentExpense();
      this.closeDeleteDialog();
    },
    error: (err) => console.error(err)
  

   //   // ✅ update totals
      //   this.getCurrentExpense();

      //   this.closeDeleteDialog();
      // },
      // error: (err) => console.error(err)
    });
  }

  // ================= NOTES =================
  openNotes(note: string) {
    this.selectedNote = note;
  }

  closeNotes() {
    this.selectedNote = null;
  }

  // ================= SOCKET =================
  socketUpdate() {
    const userId = JSON.parse(localStorage.getItem('userId')!);

    this.socketService.connect(userId);

    this.socketService.onExpenseUpdate().subscribe((data: any) => {
      this.usedPercent = data.usedPercent;
      this.warning = data.warning;
      this.remainsBudget = data.remaining; // ✅ FIX
    });
  }

  // ================= CATEGORY =================
  loadCategories() {
    this.budget.getAllCategories().subscribe({
      next: (res: any) => {
        this.categories = res;
      }
    });
  }

  // ================= INIT =================
  ngOnInit(): void {
     this.route.params.subscribe(params => {
    const page = Number(params['page']) || 1;
     this.selectedSort = 'latest';
    this.getTableData(page);
  });
    //this.applySort(this.selectedSort);
    this.getUserdetails();
    this.getCurrentBudget();
    this.getCurrentExpense();
    this.loadCategories();
  }

  // ================= CHART =================
  ngAfterViewInit(): void {
    this.socketUpdate();

    setTimeout(() => {
      const labels = [
        ...this.categories.map(c => c.name),
        'Remaining'
      ];

      const values = [
        ...this.categories.map(c => c.value || 0),
        this.remainsBudget // ✅ FIX
      ];

      new Chart("expenseChart", {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: ['#4caf50', '#ff9800', '#9c27b0', '#e0e0e0']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }, 500); // ✅ wait for data
  }


  // ================= AI SUMMARY =================
  openAiSummary() {
    this.dialog.open(AiSummaryModalComponent, {
      width: '50vw',
      height: '70vh',
      panelClass: 'custom-dialog',
      disableClose: false
    });
  }
}