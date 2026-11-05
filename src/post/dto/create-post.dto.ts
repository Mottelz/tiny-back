import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsInt()
    @IsPositive()
    authorId: number;
}
