import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BranchService } from '../../../core/services/branch.service';
import { Branch } from '../../../core/models/auth.model';

@Component({
  selector: 'app-super-admin-branches',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './super-admin-branches.component.html',
  styleUrl: './super-admin-branches.component.css',
})
export class SuperAdminBranchesComponent implements OnInit {
  branches: Branch[] = [];

  constructor(private branchService: BranchService) {}

  ngOnInit(): void {
    this.branchService.getAllBranches().subscribe({
      next: (res) => {
        if (res.success) {
          this.branches = res.data;
        }
      },
    });
  }
}
