import { Directive, Input, TemplateRef, ViewContainerRef, effect } from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private permissionCode: string | string[] = '';
  private isVisible = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {}

  @Input()
  set hasPermission(value: string | string[]) {
    this.permissionCode = value;
    this.updateView();
  }

  private updateView(): void {
    let hasAccess = false;

    if (!this.permissionCode) {
      hasAccess = true;
    } else if (Array.isArray(this.permissionCode)) {
      hasAccess = this.permissionCode.some(p => this.permissionService.hasPermission(p));
    } else {
      hasAccess = this.permissionService.hasPermission(this.permissionCode);
    }

    if (hasAccess && !this.isVisible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isVisible = true;
    } else if (!hasAccess && this.isVisible) {
      this.viewContainer.clear();
      this.isVisible = false;
    }
  }
}
