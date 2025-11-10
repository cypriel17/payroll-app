import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Observable, BehaviorSubject, map, startWith, catchError, of } from 'rxjs';
import { DataState } from 'src/app/enum/datastate.enum';
import { CustomHttpResponse, Page } from 'src/app/interface/appstates';
import { CustomerModel } from 'src/app/component/customer/customer.model';
import { State } from 'src/app/interface/state';
import { UserModel } from 'src/app/component/profile/user.model';
import { CustomerService } from 'src/app/component/customer/customer.service';
import { NotificationService } from 'src/app/service/notification.service';

@Component({
  selector: 'app-newinvoice',
  templateUrl: './newinvoice.component.html',
  styleUrls: ['./newinvoice.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewinvoiceComponent implements OnInit {
  newInvoiceState$: Observable<State<CustomHttpResponse<CustomerModel[] & UserModel>>>;
  private dataSubject = new BehaviorSubject<CustomHttpResponse<CustomerModel[] & UserModel>>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  readonly DataState = DataState;

  constructor(private customerService: CustomerService, private notification: NotificationService) { }

  ngOnInit(): void {
    this.newInvoiceState$ = this.customerService.newInvoice$()
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          console.log(response);
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADING }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.ERROR, error })
        })
      )
  }

  newInvoice(newInvoiceForm: NgForm): void {
    this.dataSubject.next({ ...this.dataSubject.value, message: null });
    this.isLoadingSubject.next(true);
    this.newInvoiceState$ = this.customerService.createInvoice$(newInvoiceForm.value.customerId, newInvoiceForm.value)
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          console.log(response);
          newInvoiceForm.reset({ status: 'PENDING' });
          this.isLoadingSubject.next(false);
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED, appData: this.dataSubject.value };
        }),
        startWith({ dataState: DataState.LOADED, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.notification.onError(error);
          this.isLoadingSubject.next(false);
          return of({ dataState: DataState.LOADED, error })
        })
      )
  }

}
