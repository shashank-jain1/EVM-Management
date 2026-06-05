import React from 'react';
import { Controller } from 'react-hook-form';

/**
 * FormField — Higher-order container to connect react-hook-form Controller with custom Input or Select components.
 */
export default function FormField({
  control,
  name,
  rules,
  render: RenderComponent,
  defaultValue = '',
  ...props
}) {
  if (!control) {
    // If no control is provided, render the component directly
    return <RenderComponent name={name} {...props} />;
  }

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field: { onChange, onBlur, value, ref }, fieldState: { error } }) => (
        <RenderComponent
          {...props}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          onBlur={onBlur}
          ref={ref}
          error={error?.message}
        />
      )}
    />
  );
}
