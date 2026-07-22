import { ApiProperty } from '@nestjs/swagger';

/**
 * Payload for creating a habit. Only the name is collected from the user;
 * streak starts at 0 (there is no check-in flow in this app).
 */
export class CreateHabitDto {
  @ApiProperty({
    description: 'Display name of the habit',
    example: 'Drink water',
  })
  name!: string;
}
