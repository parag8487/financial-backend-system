import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isNotFuture', async: false })
export class IsNotFutureConstraint implements ValidatorConstraintInterface {
    validate(value: any) {
        const today = new Date();
        const inputDate = new Date(value);
        return inputDate <= today;
    }

    defaultMessage() {
        return 'Date cannot be in the future';
    }
}

export function IsNotFuture(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsNotFutureConstraint,
        });
    };
}
