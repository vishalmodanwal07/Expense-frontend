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

// getAllExpense(sort?: any, page: number = 1, limit: number = 5) {
//   return this.http.get(
//     `${this.baseUrlExpense}?sort=${sort}&page=${page}&limit=${limit}`
//   );
// }
getAllExpense(sort: string = '', page: number = 1, category: string = '', limit: number = 5) {
  let params = `sort=${sort}&page=${page}&limit=${limit}`;
  if (category) params += `&category=${category}`;
  return this.http.get(`${this.baseUrlExpense}?${params}`);
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

updateExpense(id: any, data: any) {
  return this.http.put(`${this.baseUrlExpense}/${id}`, data);
 
}

// getAiSummary(message: string) {
//   return this.http.post(`${this.baseUrl}/ai-summary`, { message });
// }

getAiSummary(message: string) {
  return this.http.post(`${environment.apiUrl}/summary`, { message });
}

getUserCategories() {
  return this.http.get(`${this.baseUrlExpense}/user-categories`);

}

  /** Sum of amounts per category (all expenses), for charts. */
  getCategorySummary() {
    return this.http.get<{ items: { category: string; total: number }[] }>(
      `${this.baseUrlExpense}/category-summary`
    );
  }


scanReceipt(file: File) {
  const formData = new FormData();
  formData.append('receipt', file);
  return this.http.post(`${this.baseUrlExpense}/scan-receipt`, formData);
}
}  