import {Component, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { FormGroup, FormBuilder, FormArray, Validators, FormControl } from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';

import exportFromJSON from 'export-from-json'

export interface UserData {
  id: number;
  slug: string;
  firstLanguage: string;
  secondLanguage: string;
  thirdLanguage: string;
  progress: string;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  
  displayedColumns: string[] = ['id', 'slug', 'firstLanguage', 'secondLanguage', 'thirdLanguage', 'progress', 'status', 'action'];
  dataSource: MatTableDataSource<UserData>;

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  public dataExpand: boolean;

  public dataForm: FormGroup;
  public i18nData = [];
  public i18nFile: FormGroup; 

  /** Edit - Created */
  public isCreated: boolean;

  constructor(private fb: FormBuilder, private _snackBar: MatSnackBar) {
    // Assign the data to the data source for the table to render
    this.dataSource = new MatTableDataSource(undefined);
    this.dataExpand = false;
  }

  ngOnInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.initForm();
  }

  public initForm() {
    this.dataForm = this.fb.group({
      slug: [''],
      firstLanguage: [''],
      secondLanguage: [''],
      thirdLanguage: [''],
      status: [null]
    })
  }

  public applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  public expandData(data) {
    if (data === 'open') {
      this.dataExpand = (this.dataExpand !== true) ? true : false;
      this.isCreated = true;
    } else if (data === 'closed') {
      this.dataExpand = false;
      this.cleanData();
    } else {
      this.fullData(data);
      this.isCreated = false;
      this.dataExpand = (this.dataExpand !== true) ? true : false;
    }
  }

  private cleanData() {
    this.dataForm.controls.slug.setValue('');
    this.dataForm.controls.firstLanguage.setValue('');
    this.dataForm.controls.secondLanguage.setValue('');
    this.dataForm.controls.thirdLanguage.setValue('');
    this.dataForm.controls.status.setValue(null);
  }

  private fullData(value) { 
    this.dataForm.controls.slug.setValue(value.slug);
    this.dataForm.controls.firstLanguage.setValue(value.firstLanguage);
    this.dataForm.controls.secondLanguage.setValue(value.secondLanguage);
    this.dataForm.controls.thirdLanguage.setValue(value.thirdLanguage);
  }
  
  public sendData() {
    if (this.isCreated !== false) {
      let isTrue: boolean = false;
      if (this.i18nData.length > 0) {
        if (this.dataForm.controls.slug.value !== '') {
          this.i18nData.forEach( res => {
            if (res.slug === this.dataForm.controls.slug.value) {
              isTrue = true;
            }
          })
          if (isTrue !== false) { this.openSnackBar(); } else { this.add(this.dataForm.value); }
        } else {
          this.add(this.dataForm.value);
        }
      } else {
        this.add(this.dataForm.value);
      }
    } else {
      this.i18nData.forEach( res => {
        if (res.slug === this.dataForm.controls.slug.value) {
          this.edit(res, this.dataForm.value)
        }
      })
    }
  }

  public add(data) {
    const idValue = this.i18nData.length + 1;
    const result = this.calculate(data);
    const dataPush = {
      id: idValue,
      slug: data.slug,
      firstLanguage: data.firstLanguage,
      secondLanguage: data.secondLanguage,
      thirdLanguage: data.thirdLanguage,
      progress: result.progress,
      status: result.status
    }
    if (result.progress !== 0) {
      this.i18nData.push(dataPush);
      this.dataSource = new MatTableDataSource(this.i18nData);
      this.expandData('closed');
    }
  }

  public edit(data, newData) {
    const i = data.id - 1;
    const result = this.calculate(newData);
    this.i18nData[i].firstLanguage = newData.firstLanguage;
    this.i18nData[i].secondLanguage = newData.secondLanguage;
    this.i18nData[i].thirdLanguage = newData.thirdLanguage;
    this.i18nData[i].progress = result.progress;
    this.i18nData[i].status = result.status;
    this.expandData('closed');
  }

  private calculate(data) {
    let progressValue = 0;
    progressValue = data.slug !== '' ? (progressValue + 25) : progressValue;
    progressValue = data.firstLanguage !== '' ? (progressValue + 25) : progressValue;
    progressValue = data.secondLanguage !== '' ? (progressValue + 25) : progressValue;
    progressValue = data.thirdLanguage !== '' ? (progressValue + 25) : progressValue;
    let statusValue = '';
    if ((data.status === false || data.status === null) && progressValue === 0) { statusValue = ''; } else
    if ((data.status === false || data.status === null) && (progressValue > 0 && progressValue < 100)) { statusValue = 'Doing' } else
    if ((data.status === false || data.status === null) && progressValue === 100) { statusValue = 'Ready for review' } else
    if (data.status === true && progressValue === 100) { statusValue = 'Ready for production' }
    return { progress: progressValue, status: statusValue }
  }

  public openSnackBar() {
    const message = 'The slug already exists';
    const action = 'Danger';
    this._snackBar.open(message, action, {
      duration: 2500,
    });
  }

  generate(value) {
    this.i18nFile = this.fb.group({});
    this.i18nData.forEach( res => {
      const slug = res.slug;
      let language
      if (value === 'en') {
        language = res.firstLanguage;
      } else if (value === 'es') {
        language = res.secondLanguage;
      } else if (value === 'pt') {
        language = res.thirdLanguage;
      }
      this.i18nFile.addControl( slug, new FormControl(language));
    })
    console.log('data ', this.i18nFile.value);
    this.downloadExport(this.i18nFile.value, value, 'json');
  }

  downloadExport(content, name, format) {
    const data = content;
    const fileName = name;
    const exportType = format;
    exportFromJSON({ data, fileName, exportType });
  }
}
