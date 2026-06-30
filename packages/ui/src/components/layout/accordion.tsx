'use client';

import * as React from 'react';
import { Accordion as AccordionPrimitive } from 'radix-ui';
import { ChevronDown } from 'lucide-react';

import { cn } from '../../lib/cn';

/**
 * Accordion Component - Nhóm danh sách xếp chồng co giãn (collapsible) trong Pumni OS.
 * Được xây dựng trên nền tảng Radix UI Accordion.
 *
 * @example
 * ```tsx
 * <Accordion type="single" collapsible>
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>Is it accessible?</AccordionTrigger>
 *     <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 * ```
 */
function Accordion({
  ref,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root ref={ref} data-slot="accordion" {...props} />;
}

/**
 * AccordionItem Component - Một mục cụ thể trong Accordion, chứa trigger và content.
 */
function AccordionItem({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      data-slot="accordion-item"
      className={cn('border-b border-border', className)}
      {...props}
    />
  );
}

/**
 * AccordionTrigger Component - Thanh tiêu đề đóng vai trò nút nhấn mở/rút gọn mục.
 * Chứa biểu tượng mũi tên tự động xoay chuyển khi trạng thái đóng/mở thay đổi.
 */
function AccordionTrigger({
  ref,
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        data-slot="accordion-trigger"
        className={cn(
          'flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left outline-none focus-visible:text-primary [&[data-state=open]_svg]:rotate-180',
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-base) ease-snappy" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

/**
 * AccordionContent Component - Vùng nội dung mở rộng hiển thị thông tin chi tiết.
 * Có hiệu ứng đóng/mở trượt mượt mà.
 */
function AccordionContent({
  ref,
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      data-slot="accordion-content"
      className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn('pb-4 pt-0', className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
