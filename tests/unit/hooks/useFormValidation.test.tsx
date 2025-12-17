import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import {
  useFormValidation,
  FormField,
  InlineError,
} from '@/hooks/useFormValidation';

// =============================================================================
// Test Schema
// =============================================================================

const testSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(1, 'Age must be at least 1').max(120, 'Age too high'),
});

type TestFormValues = z.infer<typeof testSchema>;

const initialValues: TestFormValues = {
  name: '',
  email: '',
  age: 0,
};

// =============================================================================
// Test Component
// =============================================================================

interface TestFormProps {
  onSubmit?: (values: TestFormValues) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

function TestForm({ onSubmit, validateOnChange = true, validateOnBlur = true }: TestFormProps) {
  const {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldProps,
    getFieldError,
    hasFieldError,
    setFieldValue,
    reset,
  } = useFormValidation({
    schema: testSchema,
    initialValues,
    validateOnChange,
    validateOnBlur,
    onSubmit,
  });

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          {...getFieldProps('name')}
        />
        {hasFieldError('name') && (
          <span data-testid="name-error">{getFieldError('name')}</span>
        )}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...getFieldProps('email')}
        />
        {hasFieldError('email') && (
          <span data-testid="email-error">{getFieldError('email')}</span>
        )}
      </div>

      <div>
        <label htmlFor="age">Age</label>
        <input
          id="age"
          type="number"
          value={values.age || ''}
          onChange={(e) => setFieldValue('age', parseInt(e.target.value) || 0)}
          onBlur={handleBlur('age')}
        />
        {hasFieldError('age') && (
          <span data-testid="age-error">{getFieldError('age')}</span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        Submit
      </button>
      <button type="button" onClick={() => reset()}>
        Reset
      </button>

      <div data-testid="form-state">
        <span data-testid="is-valid">{isValid ? 'valid' : 'invalid'}</span>
        <span data-testid="is-dirty">{isDirty ? 'dirty' : 'clean'}</span>
        <span data-testid="is-submitting">{isSubmitting ? 'submitting' : 'idle'}</span>
      </div>
    </form>
  );
}

// =============================================================================
// useFormValidation Tests
// =============================================================================

describe('useFormValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('initializes with provided values', () => {
      render(<TestForm />);

      expect(screen.getByLabelText('Name')).toHaveValue('');
      expect(screen.getByLabelText('Email')).toHaveValue('');
      expect(screen.getByLabelText('Age')).toHaveValue(null);
    });

    it('starts as invalid with empty required fields', () => {
      render(<TestForm />);

      expect(screen.getByTestId('is-valid')).toHaveTextContent('invalid');
    });

    it('starts as clean (not dirty)', () => {
      render(<TestForm />);

      expect(screen.getByTestId('is-dirty')).toHaveTextContent('clean');
    });
  });

  describe('field changes', () => {
    it('updates values on change', async () => {
      render(<TestForm />);

      await userEvent.type(screen.getByLabelText('Name'), 'John');

      expect(screen.getByLabelText('Name')).toHaveValue('John');
    });

    it('marks form as dirty when values change', async () => {
      render(<TestForm />);

      await userEvent.type(screen.getByLabelText('Name'), 'John');

      expect(screen.getByTestId('is-dirty')).toHaveTextContent('dirty');
    });

    it('becomes valid when all fields are filled correctly', async () => {
      render(<TestForm />);

      await userEvent.type(screen.getByLabelText('Name'), 'John');
      await userEvent.type(screen.getByLabelText('Email'), 'john@example.com');
      await userEvent.clear(screen.getByLabelText('Age'));
      await userEvent.type(screen.getByLabelText('Age'), '25');

      expect(screen.getByTestId('is-valid')).toHaveTextContent('valid');
    });
  });

  describe('validation on blur', () => {
    it('shows error on blur when field is invalid', async () => {
      render(<TestForm />);

      const emailInput = screen.getByLabelText('Email');
      await userEvent.type(emailInput, 'invalid-email');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email address');
      });
    });

    it('does not show error until field is touched', async () => {
      render(<TestForm />);

      // Type invalid email but don't blur
      await userEvent.type(screen.getByLabelText('Email'), 'invalid');

      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
    });

    it('clears error when field becomes valid', async () => {
      render(<TestForm />);

      const emailInput = screen.getByLabelText('Email');

      // Create error
      await userEvent.type(emailInput, 'invalid');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });

      // Fix the error
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'valid@email.com');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('validation on change', () => {
    it('clears error when value becomes valid (validateOnChange)', async () => {
      render(<TestForm validateOnChange />);

      const nameInput = screen.getByLabelText('Name');

      // Create error by blurring empty field
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toHaveTextContent('Name is required');
      });

      // Type valid value - error should clear
      await userEvent.type(nameInput, 'John');

      await waitFor(() => {
        expect(screen.queryByTestId('name-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('calls onSubmit with values when form is valid', async () => {
      const onSubmit = vi.fn();
      render(<TestForm onSubmit={onSubmit} />);

      await userEvent.type(screen.getByLabelText('Name'), 'John');
      await userEvent.type(screen.getByLabelText('Email'), 'john@example.com');
      await userEvent.clear(screen.getByLabelText('Age'));
      await userEvent.type(screen.getByLabelText('Age'), '25');

      await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          name: 'John',
          email: 'john@example.com',
          age: 25,
        });
      });
    });

    it('does not call onSubmit when form is invalid', async () => {
      const onSubmit = vi.fn();
      render(<TestForm onSubmit={onSubmit} />);

      await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows all errors on submit attempt', async () => {
      render(<TestForm />);

      await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toHaveTextContent('Name is required');
        expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email address');
        expect(screen.getByTestId('age-error')).toBeInTheDocument();
      });
    });

    it('shows submitting state during async submit', async () => {
      const onSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<TestForm onSubmit={onSubmit} />);

      await userEvent.type(screen.getByLabelText('Name'), 'John');
      await userEvent.type(screen.getByLabelText('Email'), 'john@example.com');
      await userEvent.clear(screen.getByLabelText('Age'));
      await userEvent.type(screen.getByLabelText('Age'), '25');

      await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

      expect(screen.getByTestId('is-submitting')).toHaveTextContent('submitting');
      expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    });
  });

  describe('reset', () => {
    it('resets form to initial values', async () => {
      render(<TestForm />);

      await userEvent.type(screen.getByLabelText('Name'), 'John');
      await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

      expect(screen.getByLabelText('Name')).toHaveValue('');
      expect(screen.getByTestId('is-dirty')).toHaveTextContent('clean');
    });

    it('clears errors on reset', async () => {
      render(<TestForm />);

      // Create errors
      await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toBeInTheDocument();
      });

      // Reset
      await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

      expect(screen.queryByTestId('name-error')).not.toBeInTheDocument();
    });

    it('clears touched state on reset', async () => {
      render(<TestForm />);

      const nameInput = screen.getByLabelText('Name');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

      expect(screen.queryByTestId('name-error')).not.toBeInTheDocument();
    });
  });

  describe('getFieldProps', () => {
    it('provides correct props for input binding', () => {
      render(<TestForm />);

      const nameInput = screen.getByLabelText('Name');

      expect(nameInput).toHaveAttribute('aria-describedby', 'name-error');
    });

    it('sets aria-invalid when field has error and is touched', async () => {
      render(<TestForm />);

      const emailInput = screen.getByLabelText('Email');
      await userEvent.type(emailInput, 'invalid');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });
});

// =============================================================================
// FormField Component Tests
// =============================================================================

describe('FormField', () => {
  it('renders label and children', () => {
    render(
      <FormField label="Username" name="username">
        <input id="username" />
      </FormField>
    );

    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(
      <FormField label="Username" name="username" required>
        <input id="username" />
      </FormField>
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows description when no error', () => {
    render(
      <FormField label="Username" name="username" description="Enter your username">
        <input id="username" />
      </FormField>
    );

    expect(screen.getByText('Enter your username')).toBeInTheDocument();
  });

  it('shows error instead of description when error exists', () => {
    render(
      <FormField
        label="Username"
        name="username"
        description="Enter your username"
        error="Username is required"
      >
        <input id="username" />
      </FormField>
    );

    expect(screen.getByText('Username is required')).toBeInTheDocument();
    expect(screen.queryByText('Enter your username')).not.toBeInTheDocument();
  });

  it('has correct ARIA attributes for error', () => {
    render(
      <FormField label="Username" name="username" error="Invalid">
        <input id="username" />
      </FormField>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid');
  });
});

// =============================================================================
// InlineError Component Tests
// =============================================================================

describe('InlineError', () => {
  it('renders nothing when no error', () => {
    const { container } = render(<InlineError />);
    expect(container.firstChild).toBeNull();
  });

  it('renders error message', () => {
    render(<InlineError error="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('has alert role', () => {
    render(<InlineError error="Error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('applies custom id', () => {
    render(<InlineError error="Error" id="custom-error" />);
    expect(screen.getByRole('alert')).toHaveAttribute('id', 'custom-error');
  });
});
