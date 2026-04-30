import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class BudgetService {

  private baseUrl = `${environment.apiUrl}/budget`;

  private baseUrlExpense = `${environment.apiUrl}/expense`;

  constructor(private http: HttpClient) {}

  setBudget(data: any) {
    return this.http.post(`${this.baseUrl}/`, data);
  }

  getCurrentBudget() {
    return this.http.get(`${this.baseUrl}/month`);
  }

  updateCurrentBudget(data : any){
    return this.http.post(`${this.baseUrl}/`, data);
  }

  getTotalExpense(){
  return this.http.get(`${this.baseUrlExpense}/total`);
  }

  addExpense(data : any){
    return this.http.post(`${this.baseUrlExpense}/` , data);
  }

  // getAllExpense(sort?: any){
  //   return this.http.get(`${this.baseUrlExpense}?sort=${sort}`)
  // }

getAllExpense(sort?: any, page: number = 1, ) {
  return this.http.get(`${this.baseUrlExpense}?sort=${sort}&page=${page}`)
}


  getAllCategories(){
    return this.http.get(`${environment.apiUrl}/categories`);
  }
  deleteExpense(id : any){
    return this.http.delete(`${this.baseUrlExpense}/${id}`);
  }

  sortExpense(sort:  any){
    return this.http.get(`${this.baseUrlExpense}?${sort}`)
  }

// getAiSummary(message: string) {
//   return this.http.post(`${this.baseUrl}/ai-summary`, { message });
// }

getAiSummary(message: string) {
  return this.http.post(`${environment.apiUrl}/summary`, { message });
}
}