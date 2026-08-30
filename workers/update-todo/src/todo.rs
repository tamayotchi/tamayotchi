use serde::{Deserialize, Serialize};

use crate::error::AppResult;

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct Todo {
    pub title: String,
    #[serde(default)]
    pub completed: bool,
}

impl Todo {
    pub fn pending(title: &str) -> Self {
        Self {
            title: title.to_string(),
            completed: false,
        }
    }
}

pub fn encode_todos(todos: &[Todo]) -> AppResult<String> {
    let mut json = serde_json::to_string_pretty(todos)?;
    json.push('\n');
    Ok(json)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pending_todo_matches_omado_schema() {
        assert_eq!(
            Todo::pending("Write documentation"),
            Todo {
                title: "Write documentation".to_string(),
                completed: false,
            }
        );
    }

    #[test]
    fn encoding_matches_omado_format() {
        let encoded = encode_todos(&[Todo::pending("First")]).unwrap();

        assert_eq!(
            encoded,
            "[\n  {\n    \"title\": \"First\",\n    \"completed\": false\n  }\n]\n"
        );
    }

    #[test]
    fn completed_defaults_to_false_when_reading() {
        let todos: Vec<Todo> = serde_json::from_str(r#"[{"title":"Task"}]"#).unwrap();

        assert!(!todos[0].completed);
    }
}
