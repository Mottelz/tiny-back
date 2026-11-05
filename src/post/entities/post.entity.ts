import { Column, Entity, JoinColumn, PrimaryGeneratedColumn, ManyToOne, type Relation } from "typeorm";
import { User } from "../../user/entities/user.entity.js";

@Entity('posts')
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    content: string;

    @ManyToOne(() => User, (user) => user.posts, { nullable: false, onDelete: 'CASCADE'})
    @JoinColumn({ name: 'authorId'})
    author: Relation<User>;

    @Column()
    authorId: number;
}
