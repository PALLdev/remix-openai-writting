import { faker } from "@faker-js/faker";

describe("smoke tests", () => {
  afterEach(() => {
    cy.cleanupUser();
  });

  it("should allow you to register and login", () => {
    const loginForm = {
      email: `${faker.internet.userName()}@example.com`,
      password: faker.internet.password(),
    };

    cy.then(() => ({ email: loginForm.email })).as("user");

    cy.visitAndCheck("/");

    cy.findByRole("link", { name: /registro/i }).click();

    cy.findByRole("textbox", { name: /correo electrónico/i }).type(
      loginForm.email
    );
    cy.findByLabelText(/contraseña/i).type(loginForm.password);
    cy.findByRole("button", { name: /crear cuenta/i }).click();

    // cy.findByRole("link", { name: /notes/i }).click();
    cy.findByRole("button", { name: /cerrar sesión/i }).click();
    // cy.findByRole("button", { name: /log in/i }).click();
  });

  // it("should allow you to make a note", () => {
  //   const testNote = {
  //     title: faker.lorem.words(1),
  //     body: faker.lorem.sentences(1),
  //   };
  //   cy.login();

  //   cy.visitAndCheck("/");

  //   cy.findByRole("link", { name: /notes/i }).click();
  //   cy.findByText("No notes yet");

  //   cy.findByRole("link", { name: /\+ new note/i }).click();

  //   cy.findByRole("textbox", { name: /title/i }).type(testNote.title);
  //   cy.findByRole("textbox", { name: /body/i }).type(testNote.body);
  //   cy.findByRole("button", { name: /save/i }).click();

  //   cy.findByRole("button", { name: /delete/i }).click();

  //   cy.findByText("No notes yet");
  // });
});
