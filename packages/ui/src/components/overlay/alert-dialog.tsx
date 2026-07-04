'use client';

import * as React from 'react';
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui';

import { cn } from '../../lib/cn';
import { Button } from '../form/button';
import { OVERLAY_ANIMATION } from './_overlay-variants';

/**
 * AlertDialog Component - Hộp thoại cảnh báo yêu cầu xác nhận khẩn cấp trong Pumni OS.
 * Được xây dựng trên nền tảng Radix UI AlertDialog.
 * Khóa tiêu điểm (focus) màn hình để bắt buộc người dùng đưa ra quyết định hành động.
 *
 * @example
 * ```tsx
 * <AlertDialog>
 *   <AlertDialogTrigger>Delete Account</AlertDialogTrigger>
 *   <AlertDialogContent>
 *     <AlertDialogHeader>
 *       <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
 *       <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
 *     </AlertDialogHeader>
 *     <AlertDialogFooter>
 *       <AlertDialogCancel>Cancel</AlertDialogCancel>
 *       <AlertDialogAction>Delete</AlertDialogAction>
 *     </AlertDialogFooter>
 *   </AlertDialogContent>
 * </AlertDialog>
 * ```
 */
function AlertDialog({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

/**
 * AlertDialogTrigger Component - Nút kích hoạt mở AlertDialog.
 */
function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

/**
 * AlertDialogPortal Component - Cổng hiển thị AlertDialog ra ngoài DOM chính.
 */
function AlertDialogPortal({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

/**
 * AlertDialogOverlay Component - Lớp nền mờ tối che phủ toàn màn hình khi mở AlertDialog.
 */
function AlertDialogOverlay({
  className,
  style,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  const mergedStyle: React.CSSProperties = { zIndex: 'var(--z-overlay)', ...style };
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      style={mergedStyle}
      className={cn(
        'fixed inset-0 overlay-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  );
}

/**
 * AlertDialogContent Component - Khung kính chứa nội dung chính của AlertDialog.
 */
function AlertDialogContent({
  className,
  children,
  style,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  const mergedStyle: React.CSSProperties = { zIndex: 'var(--z-modal)', ...style };
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        style={mergedStyle}
        className={cn(
          'fixed top-[50%] left-[50%] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] glass-panel gap-4 rounded-xl p-(--surface-padding) duration-(--duration-base) outline-none',
          OVERLAY_ANIMATION,
          'sm:max-w-lg',
          className,
        )}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  );
}

/**
 * AlertDialogHeader Component - Vùng chứa tiêu đề và mô tả của cảnh báo.
 */
function AlertDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  );
}

/**
 * AlertDialogFooter Component - Thanh chân hộp thoại chứa các nút Cancel và Action.
 */
function AlertDialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2', className)}
      {...props}
    />
  );
}

/**
 * AlertDialogTitle Component - Nhãn tiêu đề chính của cảnh báo.
 */
function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn('type-heading text-lg font-semibold', className)}
      {...props}
    />
  );
}

/**
 * AlertDialogDescription Component - Đoạn văn bản mô tả chi tiết tác động của hành động.
 */
function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn('type-label text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

/**
 * AlertDialogAction Component - Nút thực thi hành động của cảnh báo.
 * Mặc định sử dụng style Button variant="default".
 */
function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action asChild {...props}>
      <Button className={className} />
    </AlertDialogPrimitive.Action>
  );
}

/**
 * AlertDialogCancel Component - Nút hủy thao tác đóng hộp thoại.
 * Mặc định sử dụng style Button variant="outline".
 */
function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel asChild {...props}>
      <Button variant="outline" className={cn('mt-2 sm:mt-0', className)} />
    </AlertDialogPrimitive.Cancel>
  );
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
