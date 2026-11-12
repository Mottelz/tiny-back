# tiny API

This folder runs the tiny blogging API on your computer, with sample users and
posts already loaded. Your React app will fetch data from it.

## What you need

- **Docker Desktop**, installed and running: https://www.docker.com/products/docker-desktop/

You don't need Node, pnpm or a database. Docker handles all of it.

## Start the API

1. Unzip this folder anywhere (for example next to your `tiny-front` folder).
2. Open a terminal **in this folder** (the one with `docker-compose.yaml`).
3. Run:

   ```bash
   docker compose up -d --build
   ```

The first start takes a minute or two. After that it starts in seconds.

4. Open http://localhost:3000 in your browser. You should see:

   ```json
   {"alive":true}
   ```

## Stop the API

```bash
docker compose down
```

Your data is kept. The next `docker compose up -d` brings it back.

## Reset to the original sample data

```bash
docker compose down -v
docker compose up -d
```

`-v` deletes the stored data. The sample users and posts are loaded again on the next start.

## Routes

Base URL: `http://localhost:3000`

| Method | Route       | What it does         | Body (JSON)                           |
| ------ | ----------- | -------------------- | ------------------------------------- |
| GET    | `/user`     | List all users       |                                       |
| GET    | `/user/:id` | Get one user         |                                       |
| POST   | `/user`     | Create a user        | `{ "name", "email", "password" }`     |
| PATCH  | `/user/:id` | Update a user        | any of `name`, `email`, `password`    |
| DELETE | `/user/:id` | Delete a user        |                                       |
| GET    | `/post`     | List all posts       |                                       |
| GET    | `/post/:id` | Get one post         |                                       |
| POST   | `/post`     | Create a post        | `{ "title", "content", "authorId" }`  |
| PATCH  | `/post/:id` | Update a post        | any of `title`, `content`, `authorId` |
| DELETE | `/post/:id` | Delete a post        |                                       |

Rules:
- `password` must be at least 8 characters.
- `email` must be a valid email and must not already be used.
- `authorId` must be the `id` of an existing user.
- Passwords are never returned.

### Example responses

`GET /post/1`

```json
{ "id": 1, "title": "A Thing", "content": "This is some interesting content.", "authorId": 1 }
```

`GET /user/999` (not found)

```json
{ "message": "Not Found", "statusCode": 404 }
```

`POST /post` with missing fields (validation error)

```json
{
  "message": ["title should not be empty", "content should not be empty"],
  "error": "Bad Request",
  "statusCode": 400
}
```

### Fetching from React

```js
const res = await fetch('http://localhost:3000/post');
const posts = await res.json();
```

```js
const res = await fetch('http://localhost:3000/post', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Hello', content: 'My first post', authorId: 1 }),
});
```

## Troubleshooting

**`Cannot connect to the Docker daemon` / `docker: command not found`**
Docker Desktop isn't running. Open it, wait until it says it's running, and try again.

**`port is already allocated` / `address already in use` (port 3000)**
Something else is using port 3000. Stop it, or change `"3000:3000"` to
`"3001:3000"` in `docker-compose.yaml` and use `http://localhost:3001`.

**The browser shows "This site can't be reached" right after starting**
The API takes a few seconds to start. Wait and refresh. To see what it's doing:

```bash
docker compose logs -f api
```

(Press `Ctrl+C` to stop watching the logs. The API keeps running.)

**Something is broken and you want a clean start**

```bash
docker compose down -v
docker compose up -d --build
```
