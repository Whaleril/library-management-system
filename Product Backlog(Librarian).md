# Product Backlog（Librarian）
Week 1-12 Software PM Course Project: Library-Management-System

| ID  | User Story (English) | criteria |
| --- | --- | --- |
| L1.1 | As a librarian, I want to add a new book to the system so that readers can find and borrow it. | Required fields (title, author, ISBN) must be completed.<br>Duplicate ISBN shows an error message.<br>Success returns book ID and creation time. |
| L1.2 | As a librarian, I want to edit existing book details (e.g., shelf location) so that the catalog remains accurate. | Existing book ID must be valid.<br>Modifiable fields update successfully.<br>Changes reflect immediately in book details. |
| L1.3 | As a librarian, I want to view a list of all books with their current status so that I can manage the inventory. | List displays all books with status (available/total copies).<br>Supports pagination (page/size).<br>Supports filtering by genre or availability. |
| L1.4 | As a librarian, I want to delete or archive a book record so that discarded books are removed from circulation. | Book with no active loans can be deleted.<br>Book with active loans shows error/cannot delete.<br>Confirmation prompt before deletion. |
| L2.1 | As a librarian, I want to manually process a book checkout for a reader so that they can borrow books offline. | Valid userId and bookId required.<br>Book must be available (availableCopies > 0).<br>User must not have unpaid fines.<br>Success creates loan record and updates due date. |
| L2.2 | As a librarian, I want to process a book return so that the book becomes available for others. | Valid loan ID required.<br>Book status updates to available.<br>Overdue fines calculated automatically if applicable.<br>Already returned books show error. |
| L2.3 | As a librarian, I want to manage book reservations (holds) so that I can prepare books for pickup. | View all holds with status (WAITING, etc.).<br>Notify user when book is ready.<br>Cancel hold removes reservation record. |
| L2.4 | As a librarian, I want to scan a book's ISBN/barcode to quickly load its details so that I can work faster. | Valid ISBN/Barcode format required.<br>Scanning loads book details quickly (title, location, copies).<br>Invalid code shows error message. |
| L3.1 | As a librarian, I want to see a list of overdue loans so that I can follow up with the readers. | List shows loans past due date.<br>Displays overdue days and calculated fine amount.<br>Supports pagination. |
| L3.2 | As a librarian, I want to record fine payments so that reader accounts can be cleared of debts. | Amount cannot exceed outstanding fine.<br>Success updates user account balance/status.<br>Reason for forgiveness recorded (optional). |
| L3.3 | As a librarian, I want to mark a returned book as damaged or lost so that it is temporarily removed from circulation. | Status updates to DAMAGED or LOST.<br>Available copies decrease accordingly.<br>Reason for status change recorded.<br>Book removed from circulation list. |
| L3.4 | As a librarian, I want to view a basic dashboard of daily activities (checkouts, returns) so that I can track library usage. | Displays daily stats (checkouts, returns).<br>Data reflects real-time or daily aggregated numbers.<br>Visual chart or list format supported. |
