# Database Schema

We are using MongoDB with Mongoose. The database is intentionally kept simple for Week 1, consisting solely of the `User` collection.

## 1. `users` Collection

Stores authentication and profile information for candidates.

### Schema Definition

| Field | Type | Required | Unique | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Yes | Yes | MongoDB primary key. |
| `email` | String | Yes | Yes | Normalized user email. Validated via regex. |
| `password` | String | Yes | No | Bcrypt hashed password (salt rounds: 12). |
| `createdAt` | Date | Yes | No | Timestamp of account creation (default: `Date.now`). |
| `updatedAt` | Date | Yes | No | Timestamp of last document modification. |
| `__v` | Number | Yes | No | Mongoose document version key. |

### Indexes
- `email` (Unique, 1)

### Document Transformation
When serialized via `toJSON`, the `User` model automatically:
- Maps `_id` to `id` (String).
- Deletes the `password` field to prevent accidental leakage.
- Deletes `__v` and `_id`.

### Future Expansion
In Week 2+, we will add collections for `Interviews` (storing aggregated scores) and `Answers` (storing individual question transcripts and SIamese network similarity scores).
